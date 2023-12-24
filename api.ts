interface country {
    name: {
        common: string,
    },
    cca3: string,
    area: number,
    borders?: Array<string>,
}

interface countries {
    [key: string]: country;
}

const codeFromName = async (name: string, countries: countries) =>
    Object.values(countries).find((code) => code.name.common === name)?.cca3;

const nameFromCode = async (code: string, countries: countries) => countries[code].name.common;

const getCountryBorders = async (countries: countries, country: string) => countries[country].borders;

// Использование поиска в ширину для нахождения кратчайшего (единственного) пути

export const getRoute = async (countries: countries, from: string, to: string) => {

    const visited = new Set();
    const queue = [[from]];
    let counter = 0;

    while (queue.length > 0) {
        // counter += 1;
        const currentPath = queue.shift();

        if (currentPath !== undefined) {

            const currentCountry = currentPath[currentPath.length - 1];

            if (currentCountry === to) {
                return {
                    route: currentPath,
                    requestsCount: counter,
                };
            }

            if (!visited.has(currentCountry)) {
                visited.add(currentCountry);

                const borders = await getCountryBorders(countries, currentCountry);

                if (borders) {
                    counter += 1;

                    for (const border of borders) {
                        const newPath = [...currentPath, border];
                        queue.push(newPath);
                    }
                }
            }
        }
    }

    return {
        route: [],
        requestsCount: null,
    };
};


// расчет нескольких путей одной длины (?)
// export const getRoute = async (countriesData: countries, from: string, to: string) => {
//     const visited = new Set();
//     const queue = [[from]];

//     const paths = [];

//     let counter = 0;

//     while (queue.length > 0) {
//         // counter += 1;
//         const currentPath = queue.shift();
//         const currentCountry = currentPath.at(-1);

//         if (currentCountry === to) {
//             if (!paths.length || currentPath.length === paths[0].length) {
//                 paths.push(currentPath);
//             } else if (currentPath.length < paths[0].length) {
//                 paths.length = 1;
//                 paths[0] = currentPath;
//             }
//         }

//         if (!visited.has(currentCountry)) {
//             visited.add(currentCountry);

//             // eslint-disable-next-line no-await-in-loop
//             const borders = await getCountryBorders(countriesData, currentCountry);
//             counter += 1;
//             console.log(counter, borders);

//             for (const border of borders) {
//                 const newPath = [...currentPath, border];
//                 queue.push(newPath);
//             }
//         }
//     }

//     return paths.length > 0 ? { routes: paths, requestsCount: counter } : { routes: [], requestsCount: null };
// };

export { codeFromName, nameFromCode, countries, country };
