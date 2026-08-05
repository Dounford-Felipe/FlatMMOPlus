interface Set<T> {
    /**
     * Imprements Array.some, but for Set
     * @param predicate
     * @returns {boolean}
     */
    some(predicate: (item: T) => boolean): boolean;

    /**
     * Toggles an item on or off the Set
     * @param item
     */
    toggle(item: T): void;
}