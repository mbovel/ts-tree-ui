export class PubSub<E> {
    handlers: Set<(v: E) => any> = new Set();

    subscribe(fn: (event: E) => any) {
        this.handlers.add(fn);
    }

    unsubscribe(fn: (event: E) => any) {
        this.handlers.delete(fn);
    }

    emit(event: E) {
        for (const fn of this.handlers) {
            fn(event);
        }
    }
}
