export const codeFromName = async (name, countries) =>
    Object.values(countries).find((code) => code.name.common === name)?.cca3;

export const nameFromCode = async (code, countries) => countries[code].name.common;

const getCountryBorders = async (countries, country) => Object.values(countries[country].borders);

// Использование поиска в ширину для нахождения кратчайшего (единственного) пути

// export const getRoute = async (data, from, to) => {
//     const countries = {
//         ...data,
//     };

//     const visited = new Set();
//     const queue = [[from]];
//     let counter = 0;

//     while (queue.length > 0) {
//         // counter += 1;
//         const currentPath = queue.shift();
//         const currentCountry = currentPath.at(-1);

//         if (currentCountry === to) {
//             return {
//                 route: currentPath,
//                 requestsCount: counter,
//             };
//         }

//         if (!visited.has(currentCountry)) {
//             visited.add(currentCountry);

//             const borders = await getCountryBorders(countries, currentCountry);
//             counter += 1;

//             for (const border of borders) {
//                 const newPath = [...currentPath, border];
//                 queue.push(newPath);
//             }
//         }
//     }

//     return {
//         route: [],
//         requestsCount: null,
//     };
// };

export const getRoute = async (countriesData, from, to) => {
    const visited = new Set();
    const queue = [[from]];

    const paths = [];

    let counter = 0;

    while (queue.length > 0) {
        // counter += 1;
        const currentPath = queue.shift();
        const currentCountry = currentPath.at(-1);

        if (currentCountry === to) {
            // return {
            //     route: currentPath,
            //     requestsCount: counter,
            // };
            if (!paths.length || currentPath.length === paths[0].length) {
                paths.push(currentPath);
            } else if (currentPath.length < paths[0].length) {
                paths.length = 1;
                paths[0] = currentPath;
            }
        }

        if (!visited.has(currentCountry)) {
            visited.add(currentCountry);

            // eslint-disable-next-line no-await-in-loop
            const borders = await getCountryBorders(countriesData, currentCountry);
            counter += 1;
            console.log(counter, borders);

            for (const border of borders) {
                const newPath = [...currentPath, border];
                queue.push(newPath);
            }
        }
    }

    // return {
    //     route: [],
    //     requestsCount: null,
    // };
    return paths.length > 0 ? { routes: paths, requestsCount: counter } : { routes: [], requestsCount: null };
};
