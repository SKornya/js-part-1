/* eslint-disable no-unused-vars */
/* eslint-disable no-restricted-imports */
import Maps from './maps.js';
import { getRoute, codeFromName, nameFromCode, country, countries } from './api.js';

// Загрузка данных через await
async function getDataAsync(url: string): Promise<country[]> {
    // https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
        redirect: 'follow',
    });

    // При сетевой ошибке (мы оффлайн) из `fetch` вылетит эксцепшн.
    // Тут мы даём ему просто вылететь из функции дальше наверх.
    // Если же его нужно обработать, придётся обернуть в `try` и сам `fetch`:
    //
    // try {
    //     response = await fetch(url, {...});
    // } catch (error) {
    //     // Что-то делаем
    //     throw error;
    // }

    // Если мы тут, значит, запрос выполнился.
    // Но там может быть 404, 500, и т.д., поэтому проверяем ответ.
    if (response.ok) {
        return response.json();
    }

    // Пример кастомной ошибки (если нужно проставить какие-то поля
    // для внешнего кода). Можно выкинуть и сам `response`, смотря
    // какой у вас контракт. Главное перевести код в ветку `catch`.

    const error = {
        status: response.status,
        text: response.statusText,
        // customError: 'wtfAsync',
    };
    throw error;
}

// Загрузка данных через промисы (то же самое что `getDataAsync`)
function getDataPromise(url: string): Promise<country[]> {
    // https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
    return fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
        redirect: 'follow',
    }).then(
        (response) => {
            // Если мы тут, значит, запрос выполнился.
            // Но там может быть 404, 500, и т.д., поэтому проверяем ответ.
            if (response.ok) {
                return response.json();
            }
            // Пример кастомной ошибки (если нужно проставить какие-то поля
            // для внешнего кода). Можно зареджектить и сам `response`, смотря
            // какой у вас контракт. Главное перевести код в ветку `catch`.
            return Promise.reject({
                status: response.status,
                customError: 'wtfPromise',
            });
        },

        // При сетевой ошибке (мы оффлайн) из fetch вылетит эксцепшн,
        // и мы попадём в `onRejected` или в `.catch()` на промисе.
        // Если не добавить `onRejected` или `catch`, при ошибке будет
        // эксцепшн `Uncaught (in promise)`.
        (error) => {
            // Если не вернуть `Promise.reject()`, для внешнего кода
            // промис будет зарезолвлен с `undefined`, и мы не попадём
            // в ветку `catch` для обработки ошибок, а скорее всего
            // получим другой эксцепшн, потому что у нас `undefined`
            // вместо данных, с которыми мы работаем.
            return Promise.reject(error);
        }
    );
}

// Две функции просто для примера, выберите с await или promise, какая нравится
const getData = getDataAsync;

async function loadCountriesData() {
    let countries = [];
    try {
        // ПРОВЕРКА ОШИБКИ №1: ломаем этот урл, заменяя all на allolo,
        // получаем кастомную ошибку.
        countries = await getData('https://restcountries.com/v3.1/all?fields=name,cca3,area,borders');
    } catch (error) {
        // console.log('catch for getData');
        // console.error(error);
        throw error;
    }

    return countries.reduce((result: countries, country: country) => {
        result[country.cca3] = country;
        return result;
    }, {});
}

const form = document.getElementById('form') as HTMLFormElement;
const fromCountry = document.getElementById('fromCountry') as HTMLInputElement;
const toCountry = document.getElementById('toCountry') as HTMLInputElement;
const countriesList = document.getElementById('countriesList') as HTMLDataListElement;
const submit = document.getElementById('submit') as HTMLInputElement;
const output = document.getElementById('output') as HTMLDivElement;

const saveDataInSessionStorage = (countriesData: countries): void => {
    sessionStorage.setItem('countriesData', JSON.stringify(countriesData));
};

const getDataFromSessionStorage = (key: string): countries => JSON.parse(sessionStorage.getItem(key) || '{}');

(async () => {
    fromCountry.disabled = true;
    toCountry.disabled = true;
    submit.disabled = true;

    output.textContent = 'Loading…';
    // let countriesData = {};

    // показалось, что будет лучше сохранять локально страны,
    // не делая запрос при каждой перезагрузке страницы

    if (!sessionStorage.countriesData) {
        try {
            // ПРОВЕРКА ОШИБКИ №2: Ставим тут брейкпоинт и, когда дойдёт
            // до него, переходим в оффлайн-режим. Получаем эксцепшн из `fetch`.

            // countriesData = await loadCountriesData();
            saveDataInSessionStorage(await loadCountriesData());
        } catch (error) {
            // console.log('catch for loadCountriesData');
            console.error(error);

            if (error instanceof Object && 'status' in error && 'text' in error) {
                output.textContent = `Error ${error.status}. ${error.text}`;
            }

            return;
        }
    }

    const countriesData = getDataFromSessionStorage('countriesData');

    output.textContent = '';

    // Заполняем список стран для подсказки в инпутах
    Object.keys(countriesData)
        .sort((a, b) => countriesData[b].area - countriesData[a].area)
        .forEach((code) => {
            const option = document.createElement('option');
            option.value = countriesData[code].name.common;
            countriesList.appendChild(option);
        });

    fromCountry.disabled = false;
    toCountry.disabled = false;
    submit.disabled = false;

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        try {
            fromCountry.disabled = true;
            toCountry.disabled = true;
            submit.disabled = true;

            // TODO: Вывести, откуда и куда едем, и что идёт расчёт.

            const fromCode = await codeFromName(fromCountry.value, countriesData);
            const toCode = await codeFromName(toCountry.value, countriesData);

            if (fromCode && toCode) {
                output.textContent = 'Calculating...';

                // TODO: Рассчитать маршрут из одной страны в другую за минимум запросов.

                const { route, requestsCount} = await getRoute(countriesData, fromCode, toCode);

                console.log(route, requestsCount);

                output.textContent = '';

                Maps.setEndPoints(fromCode, toCode);

                // TODO: Вывести маршрут и общее количество запросов.

                if (!!route.length && route.length < 10) {
                    Maps.markAsVisited(route);

                    for (let country of route) {
                        country = await nameFromCode(country, countriesData);
                    }

                    const formattedRoute = route.join(' -> ');

                    output.innerHTML = `
                    <p>${formattedRoute}</p>
                    <p>Потребовалось ${requestsCount} запросов!</p>`;
                } else if (!route.length) {
                    output.textContent = `There is no land route between ${fromCountry.value} and ${toCountry.value}`;
                } else if (route.length > 10) {
                    output.textContent = `Too long route between ${fromCountry.value} and ${toCountry.value}`;
                }
            } else {
                output.textContent = 'Wrong input!';
                Maps.setEndPoints(); // чистим карту
            }

            fromCountry.disabled = false;
            toCountry.disabled = false;
            submit.disabled = false;
        } catch (error: unknown) {
            output.textContent = 'Error is caused. Check the console (DevTools).';
            console.log(error);
        }

        form.reset();
    });
})();


// Для варианта с нахождением нескольких маршрутов
// if (fromCode && toCode) {
//     output.textContent = 'Calculating...';

//     // TODO: Рассчитать маршрут из одной страны в другую за минимум запросов.

//     const { routes, requestsCount} = await getRoute(countriesData, fromCode, toCode);

//     console.log(routes, requestsCount);

//     output.textContent = '';

//     Maps.setEndPoints(fromCode, toCode);

//     // TODO: Вывести маршрут и общее количество запросов.

//     if (!!routes.length && routes[0]!.length < 10) {
//         // Maps.markAsVisited(route);

//         const formattedRoutes = routes
//             .map((route) => {
//                 Maps.markAsVisited(route);
//                 route!.forEach(async (country) => {
//                     country = await nameFromCode(country, countriesData);
//                 });
//                 const joinedRoute = route!.join(' -> ');
//                 return `<p>${joinedRoute}</p>`;
//             })
//             .join('');

//         output.innerHTML = `
//         <p>${formattedRoutes}</p>
//         <p>Потребовалось ${requestsCount} запросов!</p>`;
//     } else if (!routes.length) {
//         output.textContent = `There is no land route between ${fromCountry.value} and ${toCountry.value}`;
//     } else if (routes[0]!.length > 10) {
//         output.textContent = `Too long route between ${fromCountry.value} and ${toCountry.value}`;
//     }
// } else {
//     output.textContent = 'Wrong input!';
//     Maps.setEndPoints(); // чистим карту
// }
