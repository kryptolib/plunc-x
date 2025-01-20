export const Pluncx = {
    scope: <T extends {[key: string]: any}>(): T => {
        return {} as T
    },
    app: () => {
        return {
            /**
             * Registers a function that executes when the App is ready
             * @param callback - Function to call after the app is set to ready
             */
            ready:(callback:()=>unknown)=> {}
        }
    },
    patch: (): Promise<void> => {
        return new Promise((resolve, reject) => resolve())
    }
}