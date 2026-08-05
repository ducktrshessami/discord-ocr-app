import { APIApplicationCommandOptionChoice } from "@discordjs/core";
import { distance } from "fastest-levenshtein";

type QueriedChoiceData<T extends string | number> = APIApplicationCommandOptionChoice<T> & {
    startsWith: number;
    includes: number;
    distance: number;
};
interface Reducible<K, V> {
    reduce<T>(
        fn: (
            accumulator: T,
            value: V,
            key: K,
            reducible: this
        ) => T,
        initialValue?: T
    ): T;
}

function standardizeQuery(str: string): string {
    return str
        .replaceAll(/\s+/g, "_")
        .toLowerCase();
}

function parseChoiceData<T extends string | number>(query: string, choiceData: APIApplicationCommandOptionChoice<T>): QueriedChoiceData<T> {
    const standardized = standardizeQuery(choiceData.name);
    const index = standardized.indexOf(query);
    return {
        ...choiceData,
        startsWith: Number(index === 0),
        includes: Number(index > -1),
        distance: distance(query, choiceData.name)
    };
}

export function parseQuery<K, V, T extends string | number>(
    query: string,
    reducible: Reducible<K, V>,
    fn: (value: V, key: K, reducible: Reducible<K, V>) => APIApplicationCommandOptionChoice<T> | null,
    firstWhenEmptyQuery?: T
): APIApplicationCommandOptionChoice<T>[] {
    let choices: APIApplicationCommandOptionChoice<T>[];
    if (query) {
        const standardizedQuery = standardizeQuery(query);
        choices = reducible
            .reduce<QueriedChoiceData<T>[]>((accumulator, value, key, reducible) => {
                const data = fn(value, key, reducible);
                if (data) {
                    accumulator.push(parseChoiceData(standardizedQuery, data));
                }
                return accumulator;
            }, [])
            .sort((a, b) =>
                a.startsWith === b.startsWith ? (
                    a.includes === b.includes ?
                        a.distance - b.distance :
                        b.includes - a.includes
                ) : b.startsWith - a.startsWith
            );
    }
    else {
        choices = reducible.reduce<APIApplicationCommandOptionChoice<T>[]>((accumulator, value, key, reducible) => {
            const data = fn(value, key, reducible);
            if (data) {
                if (data.value === firstWhenEmptyQuery) {
                    accumulator.unshift(data);
                }
                else {
                    accumulator.push(data);
                }
            }
            return accumulator;
        }, []);
    }
    return choices.slice(0, 25);
}
