const app = plunc.create("app");
app.service("AppService", (RequesterEngine_1,AppConfig_1,TemplateData_1) => {
    const RequesterEngine = RequesterEngine_1.RequesterEngine;
    const AppConfig = AppConfig_1;
    const TemplateData = TemplateData_1.TemplateData;

    /**
     * Enable this option to route users away to the login
     * page when there is no valid requester token stored
     * that is currently active
     */
    // RouteService.gatekeep()
    /**
     * Do something before the app initializes. To activate the
     * error page, simply throw an error.
     *
     * throw new PageErrorException(500, 'some error')
     */
    const bootstrap = async () => {
        const APP_CONFIG = new AppConfig();
        /**
         * To get the current existing user logged in to the app.
         * @NOTE By using this method, RequesterEngine will throw
         * an error when there is no valid requester.
         */
        const user = await RequesterEngine.get();
        /**
         * Registers view scope in your template which can then be used
         * by using the placeholder `{{template.view}}`
         */
        TemplateData.set('view', 'default');
    };

    return {
        bootstrap: bootstrap
    }
});
app.service("RequesterEngine_1", (TaskManager_1,IAuthTokenManager_1) => {
    const TaskManager = TaskManager_1;
    const IAuthTokenManager = IAuthTokenManager_1.IAuthTokenManager;

    var RequesterEngine;
    (function (RequesterEngine) {
        class Requester {
            constructor(token, id, status) {
                this.token = token;
                this.id = id;
                this.status = status;
                this.created = Date.now();
            }
            export() {
                return {
                    tkn: this.token,
                    uid: this.id,
                    ust: this.status,
                    cat: this.created,
                };
            }
        }
        const storageKey = 'rqssn';
        const GetRequesterTM = new TaskManager;
        /**
         * To allow invoking the getValidRequesterSession anywhere, we cached the data
         * to avoid calling the refresh token again. As this data is saved on closure,
         * it's valid only as soon as the page is active
         */
        let cached = null;
        /**
         * Refreshes the session token
         */
        const reauth = async (requesterSession) => {
            try {
                const refreshedToken = await IAuthTokenManager.refresh();
                requesterSession.tkn = refreshedToken;
                localStorage.setItem(storageKey, JSON.stringify(requesterSession));
                cached = {
                    tkn: refreshedToken,
                    uid: requesterSession.uid,
                    ust: requesterSession.ust,
                    cat: requesterSession.cat,
                };
                return cached;
            }
            catch (error) {
                console.error(error);
                throw new Error('x00xx1REE107');
            }
        };
        const pull = () => {
            const stored = localStorage.getItem(storageKey);
            if (stored === null) {
                return null;
            }
            let requester = null;
            if (stored !== null) {
                requester = JSON.parse(stored);
                if (requester === null) {
                    throw new Error('x00xx1REE100');
                }
                if (!('tkn' in requester)) {
                    throw new Error('x00xx1REE101');
                }
                if (!('uid' in requester)) {
                    throw new Error('x00xx1REE102');
                }
                if (!('ust' in requester)) {
                    throw new Error('x00xx1REE103');
                }
            }
            return requester;
        };
        /**
         * Creates a new Requester session
         * @param provider
         * @param emailAddress
         * @param password
         * @returns IdentityAuthority.Users.ApplicationAccess.Response
         */
        RequesterEngine.create = async (provider, emailAddress, password) => {
            if (provider === 'idauth') {
                const response = await IAuthTokenManager.get().withEmailAndPassword(emailAddress, password);
                if (!response.is_user_registered) {
                    localStorage.removeItem(storageKey);
                    throw new Error('x00xx1REE104');
                }
                const access = response.access_type;
                if (access === 'prohibited') {
                    localStorage.removeItem(storageKey);
                    return response;
                }
                if (access === 'allowed' || access === 'limited') {
                    const requester = new Requester(response.token, response.user_id, response.user_status);
                    localStorage.setItem(storageKey, JSON.stringify(requester.export()));
                    return response;
                }
                return response;
            }
            throw new Error('x00xx1REE105');
        };
        /**
         * Retrieves an existing requester session.
         * @returns
         */
        RequesterEngine.get = async () => {
            return new Promise(async (resolve, reject) => {
                try {
                    const existing = pull();
                    if (existing === null) {
                        throw new Error('x00xx1REE106');
                    }
                    const userid = existing.uid;
                    if (!GetRequesterTM.exists(userid)) {
                        GetRequesterTM.register(userid, () => {
                            return reauth(existing);
                        });
                    }
                    GetRequesterTM.listen(userid, (requester) => resolve(requester), (error) => reject(error));
                }
                catch (error) {
                    reject(error);
                }
            });
        };
        /**
         * Overrides an existing requester session.
         * @param requester
         * @returns
         */
        RequesterEngine.override = (userid, status, token) => {
            const requester = new Requester(token, userid, status);
            localStorage.setItem(storageKey, JSON.stringify(requester.export()));
        };
        /**
         * Checks whether the requester is active or not.
         * If there is an existing token, this method will
         * attempt to refresh the token, and will return
         * false if the token has expired.
         * @returns
         */
        RequesterEngine.active = async () => {
            return new Promise(async (resolve, reject) => {
                try {
                    const existing = pull();
                    if (existing === null) {
                        resolve(false);
                        return;
                    }
                    const userid = existing.uid;
                    if (!GetRequesterTM.exists(userid)) {
                        GetRequesterTM.register(userid, () => {
                            return reauth(existing);
                        });
                    }
                    GetRequesterTM.listen(userid, (requester) => resolve(true), (error) => resolve(false));
                }
                catch (error) {
                    resolve(false);
                }
            });
        };
        /**
         * Kills the session
         * @returns
         */
        RequesterEngine.end = () => {
            localStorage.removeItem(storageKey);
        };
        RequesterEngine.refresh = () => {
            const existing = pull();
            if (existing === null) {
                throw new Error('x00xx1REE106');
            }
            const every = 1000 * 60 * 7;
            setInterval(() => {
                reauth(existing);
            }, every);
        };
    })(RequesterEngine || (RequesterEngine = {}));

    return {
        RequesterEngine: RequesterEngine
    }
});
app.factory("TaskManager_1", (EventManager_1) => {
    const EventManager = EventManager_1.EventManager;

    /**
     * TaskManager
     *
     * A utility class for managing asynchronous tasks with unique identifiers.
     * TaskManager is designed to ensure a task (identified by a unique id) runs only once,
     * and subsequent attempts to interact with the same task will utilize the cached result
     * or error, provided the webpage is not reloaded.
     *
     * Features:
     * - Ensures a certain task is only executed once, and result is cached.
     * - Tracks the lifecycle of tasks (new, ongoing, completed, failed).
     * - Supports registering tasks with unique IDs.
     * - Dispatches events on task success or failure.
     * - Allows subscribing and unsubscribing listeners to handle task events.
     *
     * Dependencies:
     * - `EventManager`: Manages event registration, subscription, and dispatching.
     *
     * Example Usage:
     * ```typescript
     * const taskManager = new TaskManager();
     *
     * // Register a task
     * taskManager.register('task1', async () => {
     *   return await fetchData();
     * });
     *
     * // Listen for success and failure
     * taskManager.listen(
     *   'task1',
     *   (data) => console.log('Task succeeded with data:', data),
     *   (error) => console.error('Task failed with error:', error)
     * );
     * ```
     */
    class TaskManager {
        constructor() {
            this.tasks = {};
        }
        /**
         * Registers a new task with a unique ID.
         *
         * If a task with the given ID is already registered, this method does nothing.
         *
         * @param id - The unique identifier for the task.
         * @param task - A function that returns a Promise representing the asynchronous task.
         *
         * Example Usage:
         * ```typescript
         * taskManager.register('task1', async () => {
         *   return await fetch('https://api.example.com/data');
         * });
         * ```
         */
        register(id, task) {
            if (!(id in this.tasks)) {
                this.tasks[id] = {
                    eventids: {
                        success: EventManager.register(),
                        fail: EventManager.register()
                    },
                    status: 'new',
                    task: task,
                    data: null,
                    error: null
                };
            }
        }
        /**
         * Checks if a task with the specified ID exists in the manager.
         *
         * @param id - The unique identifier of the task.
         * @returns `true` if the task exists, otherwise `false`.
         *
         * Example Usage:
         * ```typescript
         * if (taskManager.exists('task1')) {
         *   console.log('Task1 is registered.');
         * }
         * ```
         */
        exists(id) {
            return (id in this.tasks);
        }
        /**
         * Executes a registered task by its ID.
         *
         * This method should only be called internally. It handles the task execution
         * and updates the task's status based on its resolution or rejection.
         *
         * On success, the result is stored and the success event is dispatched.
         * On failure, the error is stored and the failure event is dispatched.
         *
         * @param id - The unique identifier of the task.
         *
         * @throws Will throw an error if the task ID is invalid.
         */
        run(id) {
            const promise = this.tasks[id].task();
            promise.then(response => {
                this.tasks[id].status = 'completed';
                this.tasks[id].data = response;
                /** Dispatch success listeners */
                EventManager.dispatch(this.tasks[id].eventids.success, response);
            }).catch(error => {
                this.tasks[id].status = 'completed';
                this.tasks[id].error = new Error(error.message);
                /** Dispatch fail listeners */
                EventManager.dispatch(this.tasks[id].eventids.fail, this.tasks[id].error);
            });
        }
        /**
         * Subscribes to success and failure events for a specific task.
         *
         * If the task has already completed, the corresponding callback
         * (success or fail) is invoked immediately with the result or error.
         *
         * @param id - The unique identifier of the task.
         * @param success - Callback function invoked on task success.
         * @param fail - Optional callback function invoked on task failure.
         *
         * @throws Will throw an error if the task is not registered.
         *
         * Example Usage:
         * ```typescript
         * taskManager.listen(
         *   'task1',
         *   (data) => console.log('Task succeeded with data:', data),
         *   (error) => console.error('Task failed with error:', error)
         * );
         * ```
         */
        listen(id, success, fail) {
            if (!(id in this.tasks)) {
                /** Error: Adding listener when task is not registered */
                throw new Error('x00xx1TMS100');
            }
            EventManager.subscribe(this.tasks[id].eventids.success, success);
            if (fail !== undefined) {
                EventManager.subscribe(this.tasks[id].eventids.fail, fail);
            }
            if (this.tasks[id].status === 'new') {
                this.tasks[id].status = 'ongoing';
                this.run(id);
                return;
            }
            if (this.tasks[id].status === 'ongoing') {
                return;
            }
            if (this.tasks[id].status === 'completed') {
                const error = this.tasks[id].error;
                if (error !== null) {
                    if (fail === undefined) {
                        return;
                    }
                    fail(error);
                    return;
                }
                success(this.tasks[id].data);
            }
        }
    }

    return TaskManager;
});
app.service("EventManager_1", () => {

    var EventManager;
    (function (EventManager) {
        let eventid = 0;
        const registry = {};
        /**
         * Register a new event name.
         * @returns name - The name of the event registered
         */
        EventManager.register = () => {
            eventid++;
            const id = eventid.toString();
            registry[id] = [];
            return id;
        };
        /**
         * Subscribe to an event.
         * @param name - The name of the event to subscribe to.
         * @param listener - The listener function to be called when the event is dispatched.
         */
        EventManager.subscribe = (id, listener) => {
            if (!(id in registry)) {
                registry[id] = [];
            }
            registry[id].push(listener);
        };
        /**
         * Dispatch an event.
         * @param name - The name of the event to dispatch.
         */
        EventManager.dispatch = (id, ...args) => {
            if (!(id in registry))
                return;
            for (let i = 0; i < registry[id].length; i++) {
                const listener = registry[id][i];
                try {
                    listener(...args);
                }
                catch (error) {
                    console.error(error);
                }
            }
        };
    })(EventManager || (EventManager = {}));

    return {
        EventManager: EventManager
    }
});
app.service("IAuthTokenManager_1", (AppConfig_1,HttpRequest_1) => {
    const AppConfig = AppConfig_1;
    const HttpRequest = HttpRequest_1.HttpRequest;

    var IAuthTokenManager;
    (function (IAuthTokenManager) {
        const APP_CONFIG = new AppConfig;
        const getOptions = {
            withEmailAndPassword: async (email, password) => {
                const response = await HttpRequest.post({
                    host: APP_CONFIG.iauth.root,
                    path: '/identity-authority/user/token/generate',
                    params: {},
                    data: {
                        email_address: email,
                        password: password
                    },
                    withoutToken: true
                });
                return response;
            }
        };
        const sendOptions = {
            asEmail: async (email) => {
                const response = await HttpRequest.post({
                    host: APP_CONFIG.iauth.root,
                    path: '/identity-authority/user/token/email/send',
                    params: {},
                    data: {
                        email_address: email
                    },
                    withoutToken: true
                });
                return response;
            }
        };
        IAuthTokenManager.get = () => {
            return getOptions;
        };
        IAuthTokenManager.refresh = async () => {
            const response = await HttpRequest.get({
                host: APP_CONFIG.iauth.root,
                path: '/identity-authority/user/token/refresh',
                params: {},
                data: {}
            });
            return response.token;
        };
        IAuthTokenManager.send = () => {
            return sendOptions;
        };
    })(IAuthTokenManager || (IAuthTokenManager = {}));

    return {
        IAuthTokenManager: IAuthTokenManager
    }
});
app.factory("AppConfig_1", () => {

    class AppConfig {
        constructor() {
            // @ts-expect-error
            const GlobalWindow = window;
            if ('deployment' in GlobalWindow && 'name' in GlobalWindow.deployment) {
                if (GlobalWindow.deployment.name === 'production') {
                    this.buildMode = 'production';
                    this.iauth = {
                        root: 'http://localhost:5458'
                    };
                    this.indexer = {
                        root: 'http://localhost:8000',
                        namespace: 'eo7yQi4NglbV5OOWG0v7SgT1y4Rof6Rg'
                    };
                    this.tripengine = {
                        root: 'http://localhost:5458'
                    };
                }
            }
            else {
                this.buildMode = 'default';
                this.iauth = {
                    root: 'http://localhost:5458'
                };
                this.indexer = {
                    root: 'http://localhost:8000',
                    namespace: 'eo7yQi4NglbV5OOWG0v7SgT1y4Rof6Rg'
                };
                this.tripengine = {
                    root: 'http://localhost:5458'
                };
            }
        }
    }

    return AppConfig;
});
app.service("HttpRequest_1", () => {

    /**
     * A service that wraps around fetch API to invoke
     * network calls against API endpoints
     */
    var HttpRequest;
    (function (HttpRequest) {
        const RunAjax = (method, url, config) => {
            return new Promise((resolve, reject) => {
                let payload = '';
                let contentType = false;
                let processData = true;
                if (config.data !== undefined) {
                    if (config.data instanceof FormData) {
                        payload = config.data;
                        contentType = false;
                        processData = false;
                    }
                    else {
                        payload = JSON.stringify(config.data);
                        contentType = 'application/json';
                        processData = true;
                    }
                }
                const headers = {};
                const doNotPassRequesterToken = config.withoutToken ?? false;
                if (!doNotPassRequesterToken) {
                    const storedSession = localStorage.getItem('rqssn');
                    if (storedSession === null) {
                        /**
                         * By default, all that goes through the HttpRequestHelper will pass requester token
                         * via the X-Requester-Token field in the header, unless you pass `false` value to
                         * the `doNotPassRequesterToken` field in the config.
                         *
                         * That said, all API request that does not require the token should explicitly
                         * set this field to `true`, to avoid making issues with Public Requester (no stored
                         * session).
                         */
                        reject(new Error('x00xx1HPQ100'));
                        return;
                    }
                    const requesterSession = JSON.parse(storedSession);
                    if ('tkn' in requesterSession) {
                        headers['X-Requester-Token'] = requesterSession.tkn;
                    }
                }
                if (contentType !== false) {
                    headers['content-type'] = contentType;
                }
                const fetchconf = {
                    method: method,
                    headers: headers
                };
                /**
                 * Unlike Ajax, fetch throws an error when you attach
                 * request body to a GET request
                 */
                if (method !== 'GET') {
                    fetchconf.body = payload;
                }
                fetch(url, fetchconf).then(async (response) => {
                    const expectJson = config.isJsonRes ?? true;
                    const mimetype = response.headers.get('Content-Type');
                    let data;
                    if (mimetype && mimetype.includes('application/json')) {
                        if (!expectJson) {
                            reject(new Error('x00xx1HPQ101'));
                            return;
                        }
                        data = await response.json();
                    }
                    else {
                        data = JSON.parse(await response.text());
                    }
                    if (response.status !== 200) {
                        reject(new Error(`x00xx1HPQ103 ${response.status} ${response.statusText}`));
                        return;
                    }
                    resolve(data);
                });
            });
        };
        const PopulatePathPlaceholders = (config) => {
            const params = config.params;
            let path = config.path;
            for (const key in params) {
                const placeholder = `:${key}`;
                if (path.includes(placeholder)) {
                    path = path.split(placeholder).join(params[key]);
                }
            }
            return path;
        };
        const getParamValue = (key) => {
            const params = new URLSearchParams(window.location.search);
            const value = params.get(key);
            return value !== null ? value : null;
        };
        const ProcessMethod = (method, config) => {
            const populatedUrl = config.host + PopulatePathPlaceholders(config);
            return new Promise((resolve, reject) => {
                RunAjax(method, populatedUrl, config).then(resolve).catch(reject);
            });
        };
        HttpRequest.get = (config) => {
            return ProcessMethod('GET', config);
        };
        HttpRequest.post = (config) => {
            return ProcessMethod('POST', config);
        };
        HttpRequest.put = (config) => {
            return ProcessMethod('PUT', config);
        };
        HttpRequest.patch = (config) => {
            return ProcessMethod('PATCH', config);
        };
        HttpRequest.remove = (config) => {
            return ProcessMethod('DELETE', config);
        };
    })(HttpRequest || (HttpRequest = {}));

    return {
        HttpRequest: HttpRequest
    }
});
app.service("TemplateData_1", () => {

    /**
     * Binds data into your template through the `AppService`,
     *  which can then be used by using the placeholder
     * `{{template.view}}` in your template html.
     */
    var TemplateData;
    (function (TemplateData) {
        const data = {};
        TemplateData.set = (key, value) => {
            if (data[key] === undefined) {
                data[key] = value;
            }
        };
        TemplateData.get = () => {
            return data;
        };
    })(TemplateData || (TemplateData = {}));

    return {
        TemplateData: TemplateData
    }
});
app.component("AppRouter_6", (StateManager_1,$scope,$patch,$app,AppService,ActivationEvent_1,RouteService_1,TemplateData_1) => {
    const StateManager = StateManager_1.StateManager;
    const ActivationEvent = ActivationEvent_1.ActivationEvent;
    const RouteService = RouteService_1.RouteService;
    const TemplateData = TemplateData_1.TemplateData;

    const ready = async () => {
        try {
            /** Bootstraps the application */
            await StateManager.switch('loading');
            await AppService.bootstrap();
            const scope = $scope;
            /** Takes in template view value set by AppService */
            scope.template = TemplateData.get();
            /** Updates the state of the component */
            await StateManager.switch('active');
            $patch();
            ActivationEvent.dispatch();
        }
        catch (error) {
            console.error(error);
            /** Please @see RequesterEngine for reference of these error codes */
            if (error.message === 'x00xx1REE101' ||
                error.message === 'x00xx1REE106' ||
                error.message === 'x00xx1REE107') {
                if (RouteService.config().gatekeep) {
                    RouteService.reroute('login');
                    return;
                }
            }
            /** Please @see TenantService for reference of these error codes */
            if (error.message === 'x00xx1TNTSVC100') {
                if (RouteService.config().gatekeep) {
                    RouteService.reroute('access/library');
                    return;
                }
            }
            await StateManager.switch('error');
            $patch();
        }
    };
    var AppRouter;
    (function (AppRouter) {
        $app.ready(ready);
        AppRouter.render = () => { };
    })(AppRouter || (AppRouter = {}));

    return {
        AppRouter: AppRouter
    }
});
app.helper("StateManager_1", ($scope,$patch) => {

    class StateManagerInterface {
        constructor() {
            this.callbacks = {};
            this.blockname = null;
        }
        scope(scope) {
            this.scopeobj = scope;
        }
        patch(patch) {
            this.patchapi = patch;
        }
        block(blockName) {
            this.blockname = blockName;
        }
        /**
         * Registers a callback function that will be invoked when you switch to a specific state.
         * @NOTE You can only register one callback per state
         * @param name - The name of the state
         * @param callback - @see StateActivationCallback
         */
        register(name, callback) {
            if (name in this.callbacks) {
                console.error(`Duplicate callback for component state "${name}"`);
                return this;
            }
            this.callbacks[name] = callback;
            return this;
        }
        /**
         * Switch to a specific state
         * @param name - The name of the state
         */
        switch(name) {
            return new Promise(async (resolve, reject) => {
                try {
                    this.scopeobj.state = name;
                    await this.patchapi();
                    if (name in this.callbacks) {
                        await this.callbacks[name]();
                    }
                    resolve();
                }
                catch (error) {
                    reject(error);
                }
            });
        }
        /**
         * Returns the current state value
         */
        get() {
            return this.scopeobj.state;
        }
    }
    const StateManager = new StateManagerInterface();
    StateManager.scope($scope);
    StateManager.patch($patch);

    return {
        StateManager: StateManager
    }
});
app.service("ActivationEvent_1", (EventManager_1) => {
    const EventManager = EventManager_1.EventManager;

    var ActivationEvent;
    (function (ActivationEvent) {
        const eventid = EventManager.register();
        /**
         * Subscribe to the page activation event.
         * @param callback - The callback function to be called when the page is activated.
         */
        ActivationEvent.subscribe = (listener) => {
            EventManager.subscribe(eventid, listener);
        };
        /**
         * Dispatches the activation event
         */
        ActivationEvent.dispatch = () => {
            EventManager.dispatch(eventid);
        };
    })(ActivationEvent || (ActivationEvent = {}));

    return {
        ActivationEvent: ActivationEvent
    }
});
app.service("RouteService_1", () => {

    var RouteService;
    (function (RouteService) {
        const configuration = {
            /**
             * A flag that determines whether the page
             * requires user to login or not
             */
            gatekeep: false
        };
        /**
         * A flag that determines whether the page
         * requires user to login or not
         */
        RouteService.gatekeep = () => {
            configuration.gatekeep = true;
        };
        /**
         * Returns route configuration
         */
        RouteService.config = () => {
            return configuration;
        };
        RouteService.delay = (ms) => {
            return new Promise(async (resolve, reject) => {
                setTimeout(() => {
                    resolve();
                }, ms);
            });
        };
        /**
         * Reroutes to a different page
         */
        RouteService.reroute = (page) => {
            location.href = `/${page}.html`;
        };
    })(RouteService || (RouteService = {}));

    return {
        RouteService: RouteService
    }
});
app.component("Sidebar_3", (StateManager_1,$scope,ActivationEvent_1,SidebarControl_1) => {
    const StateManager = StateManager_1.StateManager;
    const ActivationEvent = ActivationEvent_1.ActivationEvent;
    const SidebarControl = SidebarControl_1.SidebarControl;

    const scope = $scope;
    /**
     * You can self-activate this component by subscribing to the `ActivationEvent`.
     * This event is fired after the @AppRouter component signals the page activation.
     */
    ActivationEvent.subscribe(async () => {
        SidebarControl.option.preset('Dashboard', '');
    });
    /**
     * Expose methods that parents of `Sidebar` component
     * can make use of. These methods always return Promise.
     */
    var Sidebar;
    (function (Sidebar) {
        /**
         * Allows parent component to explicitly render the
         * `Sidebar` component.
         */
        Sidebar.render = async () => {
            await StateManager.switch('active');
        };
    })(Sidebar || (Sidebar = {}));

    return {
        Sidebar: Sidebar
    }
});
app.service("SidebarControl_1", (EventManager_1) => {
    const EventManager = EventManager_1.EventManager;

    /**
     * A Controller that should serve as the middleman between the
     * Sidebar component used in the application, and the component
     * or other services that uses the Sidebar component.
     */
    var SidebarControl;
    (function (SidebarControl) {
        const selected = {
            namespace: '',
            option: ''
        };
        const SelectOptionEvent = EventManager.register();
        const PresetOptionEvent = EventManager.register();
        SidebarControl.option = {
            select: (namespace, option) => {
                selected.namespace = namespace;
                selected.option = option;
                EventManager.dispatch(SelectOptionEvent, selected);
            },
            preset: (namespace, option) => {
                selected.namespace = namespace;
                selected.option = option;
                EventManager.dispatch(PresetOptionEvent, selected);
            }
        };
        SidebarControl.events = {
            when: {
                option: {
                    selected: (callback) => {
                        EventManager.subscribe(SelectOptionEvent, callback);
                    },
                    preset: (callback) => {
                        EventManager.subscribe(PresetOptionEvent, callback);
                    }
                }
            }
        };
        SidebarControl.mobile = {
            open: () => {
                const sidebar = document.querySelector('.--sidebar-control');
                console.log(sidebar);
                if (sidebar === null)
                    return;
                sidebar.setAttribute('style', 'margin-left:0px');
            },
            close: () => {
                const sidebar = document.querySelector('.--sidebar-control');
                if (sidebar === null)
                    return;
                sidebar.removeAttribute('style');
            }
        };
    })(SidebarControl || (SidebarControl = {}));

    return {
        SidebarControl: SidebarControl
    }
});
app.component("Header_6", (ThemeSelector_1,$scope,$patch,ActivationEvent_1,RequesterEngine_1,TemplateData_1,SidebarControl_1,TenantService_1,UserService_1,Hamburger_6) => {
    const ThemeSelector = ThemeSelector_1.ThemeSelector;
    const ActivationEvent = ActivationEvent_1.ActivationEvent;
    const RequesterEngine = RequesterEngine_1.RequesterEngine;
    const TemplateData = TemplateData_1.TemplateData;
    const SidebarControl = SidebarControl_1.SidebarControl;
    const TenantService = TenantService_1.TenantService;
    const UserService = UserService_1.UserService;
    const Hamburger = Hamburger_6.Hamburger;

    const scope = $scope;
    scope.template = {
        without_tenant_context: 'false'
    };
    const transform = (templdata) => {
        if ('without_tenant_context' in templdata) {
            if (templdata.without_tenant_context === 'true') {
                scope.template.without_tenant_context = 'true';
            }
        }
    };
    ActivationEvent.subscribe(async () => {
        ThemeSelector.render();
        if (!await RequesterEngine.active()) {
            return;
        }
        const requester = await RequesterEngine.get();
        scope.user = await UserService.get.snippet(requester.uid);
        /**
         * Header component contains tenant data.
         * Stopping Header from pulling and rendering this data
         * requires passing TemplateData.without_tenant_context
         */
        transform(TemplateData.get());
        if (scope.template.without_tenant_context === 'true') {
            await $patch();
            return;
        }
        const catalog = await TenantService.get.catalog(requester);
        scope.tenant = catalog.tenant;
        await $patch();
    });
    Hamburger.events.when.isClickedOpen(SidebarControl.mobile.open);
    Hamburger.events.when.isClickedClose(SidebarControl.mobile.close);
    var Header;
    (function (Header) {
        Header.render = async () => { };
    })(Header || (Header = {}));

    return {
        Header: Header
    }
});
app.helper("ThemeSelector_1", ($scope,$patch) => {

    var ThemeSelector;
    (function (ThemeSelector) {
        const scope = $scope;
        const themeNames = ['light', 'dark'];
        const namespace = '/Plugins/ThemeSelector/';
        const GlobalWindowObject = window;
        const switchThemeTo = async (theme) => {
            scope.ThemeSelector.isDarkTheme = (theme === 'dark');
            const nonSelectedThemes = themeNames.filter(themeName => themeName !== theme);
            const bodyElement = document.querySelector('body');
            if (bodyElement === null)
                return;
            nonSelectedThemes.forEach(removableTheme => {
                bodyElement.classList.remove(removableTheme);
            });
            bodyElement.classList.add(theme);
            localStorage.setItem('slate-theme', theme);
            GlobalWindowObject.slate.theme.name = theme;
            await $patch(namespace);
        };
        scope.ThemeSelector = {
            isDarkTheme: (GlobalWindowObject.slate.theme.name === 'dark'),
            switchTheme: () => {
                if (scope.ThemeSelector.isDarkTheme) {
                    switchThemeTo('dark');
                    return;
                }
                switchThemeTo('light');
            }
        };
        ThemeSelector.render = () => { };
    })(ThemeSelector || (ThemeSelector = {}));

    return {
        ThemeSelector: ThemeSelector
    }
});
app.service("TenantService_1", (AppConfig_1,TaskManager_1,IAuthTenantManager_1,TenantIndexService_1,HttpRequest_1,RequesterEngine_1,RouteService_1) => {
    const AppConfig = AppConfig_1;
    const TaskManager = TaskManager_1;
    const IAuthTenantManager = IAuthTenantManager_1.IAuthTenantManager;
    const TenantIndexService = TenantIndexService_1.TenantIndexService;
    const HttpRequest = HttpRequest_1.HttpRequest;
    const RequesterEngine = RequesterEngine_1.RequesterEngine;
    const RouteService = RouteService_1.RouteService;

    const APP_CONFIG = new AppConfig;
    /**
         * The `TenantService` uprades user token to a token that has access
         * to a certain Tenant Id or Organization. This Tenant Id will be stored
         * in local storage and will when calling `TenantService.get().context()`
         * and will be stored as long as the user doesn't log out or clear data
         */
    const STORAGE_KEY = 'tntid';
    const TaskRegistry = {
        snippets: new TaskManager
    };
    var TenantService;
    (function (TenantService) {
        TenantService.get = {
            /**
             * A tenant catalog is taken from the tenant selected
             * by the user from access/library page.
             * @param tenantid
             * @param callback
             * @returns
             */
            catalog: (user) => {
                return new Promise(async (resolve, reject) => {
                    const tenantid = localStorage.getItem(STORAGE_KEY);
                    if (tenantid === null) {
                        reject(new Error('x00xx1TNTSVC100'));
                        return;
                    }
                    const runner = async () => {
                        const response = await TenantIndexService.stores(tenantid, user);
                        const stores = response.stores.snippets.map(store => {
                            return {
                                entity_id: store.entity_id,
                                ...store.data
                            };
                        });
                        const result = {
                            stores: stores,
                            tenant: {
                                entity_id: response.tenant.entity_id,
                                name: response.tenant.data.name,
                                profile_photo: response.tenant.data.profile_photo,
                                cover_photo: response.tenant.data.cover_photo
                            }
                        };
                        return result;
                    };
                    if (!TaskRegistry.snippets.exists(tenantid)) {
                        TaskRegistry.snippets.register(tenantid, runner);
                    }
                    TaskRegistry.snippets.listen(tenantid, resolve, reject);
                });
            }
        };
        /**
         * Retrieves certification that user has access to the tenant, and
         * use the certification to upgrade token with organization access
         * @param user
         * @param tenantid
         * @returns
         */
        TenantService.login = async (user, tenantid) => {
            const certification = await IAuthTenantManager.certify.access(tenantid);
            const response = await HttpRequest.post({
                host: APP_CONFIG.tripengine.root,
                path: '/trip-engine/organizations/:organizationId/token',
                params: { organizationId: tenantid },
                data: { access_certification_token: certification.access_certification_token }
            });
            RequesterEngine.override(user.uid, user.ust, response.upgraded_token);
            localStorage.setItem(STORAGE_KEY, tenantid);
            RouteService.reroute('index');
        };
    })(TenantService || (TenantService = {}));

    return {
        TenantService: TenantService
    }
});
app.service("IAuthTenantManager_1", (AppConfig_1,HttpRequest_1) => {
    const AppConfig = AppConfig_1;
    const HttpRequest = HttpRequest_1.HttpRequest;

    const APP_CONFIG = new AppConfig;
    var IAuthTenantManager;
    (function (IAuthTenantManager) {
        IAuthTenantManager.certify = {
            access: async (tenantid) => {
                return HttpRequest.post({
                    host: APP_CONFIG.iauth.root,
                    path: '/identity-authority/tenants/:tenantId/access/certify',
                    params: { tenantId: tenantid },
                    data: { audience: location.href }
                });
            }
        };
    })(IAuthTenantManager || (IAuthTenantManager = {}));

    return {
        IAuthTenantManager: IAuthTenantManager
    }
});
app.service("TenantIndexService_1", (AppConfig_1,HttpRequest_1) => {
    const AppConfig = AppConfig_1;
    const HttpRequest = HttpRequest_1.HttpRequest;

    const APP_CONFIG = new AppConfig;
    var TenantIndexService;
    (function (TenantIndexService) {
        TenantIndexService.snippet = async (tenantid) => {
            const response = await HttpRequest.get({
                host: APP_CONFIG.indexer.root,
                path: '/:namespace/identity-authority/tenant/retrieve/snippet?id=:id',
                params: { namespace: APP_CONFIG.indexer.namespace, id: tenantid },
                data: {},
                withoutToken: true
            });
            if (response.tenant.error !== null) {
                console.error(new Error(response.tenant.error));
                throw new Error('x00xx1TNTIS100');
            }
            return {
                entity_id: tenantid,
                name: response.tenant.data.name,
                profile_photo: response.tenant.data.profile_photo,
                cover_photo: response.tenant.data.cover_photo
            };
        };
        TenantIndexService.stores = async (tenantid, requester) => {
            const response = await HttpRequest.get({
                host: APP_CONFIG.indexer.root,
                path: '/:namespace/trip-engine/organization/stores?id=:id&token=:token',
                params: {
                    namespace: APP_CONFIG.indexer.namespace,
                    id: tenantid,
                    token: requester.tkn
                },
                withoutToken: true
            });
            return response;
        };
    })(TenantIndexService || (TenantIndexService = {}));

    return {
        TenantIndexService: TenantIndexService
    }
});
app.service("UserService_1", (TaskManager_1,UserIndexService_1) => {
    const TaskManager = TaskManager_1;
    const UserIndexService = UserIndexService_1.UserIndexService;

    const TaskRegistry = {
        snippets: new TaskManager,
        accesses: new TaskManager
    };
    var UserService;
    (function (UserService) {
        UserService.get = {
            snippet: (userid) => {
                return new Promise(async (resolve, reject) => {
                    const runner = async () => {
                        return UserIndexService.snippet(userid);
                    };
                    if (!TaskRegistry.snippets.exists(userid)) {
                        TaskRegistry.snippets.register(userid, runner);
                    }
                    TaskRegistry.snippets.listen(userid, resolve, reject);
                });
            }
        };
        UserService.list = {
            access: async (user) => {
                return new Promise(async (resolve, reject) => {
                    const runner = async () => {
                        return UserIndexService.access.tenant(user);
                    };
                    if (!TaskRegistry.accesses.exists(user.uid)) {
                        TaskRegistry.accesses.register(user.uid, runner);
                    }
                    TaskRegistry.accesses.listen(user.uid, resolve, reject);
                });
            }
        };
    })(UserService || (UserService = {}));

    return {
        UserService: UserService
    }
});
app.service("UserIndexService_1", (AppConfig_1,HttpRequest_1) => {
    const AppConfig = AppConfig_1;
    const HttpRequest = HttpRequest_1.HttpRequest;

    const APP_CONFIG = new AppConfig;
    var UserIndexService;
    (function (UserIndexService) {
        UserIndexService.snippet = async (userid) => {
            const namespace = APP_CONFIG.indexer.namespace;
            const response = await HttpRequest.get({
                host: APP_CONFIG.indexer.root,
                path: '/:namespace/identity-authority/user/retrieve/snippet?id=:id',
                params: { namespace: namespace, id: userid },
                data: {},
                withoutToken: true
            });
            return response.user.data;
        };
        UserIndexService.access = {
            tenant: async (user) => {
                const namespace = APP_CONFIG.indexer.namespace;
                const response = await HttpRequest.get({
                    host: APP_CONFIG.indexer.root,
                    path: '/:namespace/identity-authority/user/access/tenants?id=:id&token=:token',
                    params: { namespace: namespace, id: user.uid, token: user.tkn },
                    data: {},
                    withoutToken: true
                });
                const result = response.tenants.snippets.map(tenant => {
                    return {
                        entity_id: tenant.entity_id,
                        name: tenant.data.name,
                        profile_photo: tenant.data.profile_photo,
                        cover_photo: tenant.data.cover_photo
                    };
                });
                return result;
            }
        };
    })(UserIndexService || (UserIndexService = {}));

    return {
        UserIndexService: UserIndexService
    }
});
app.component("Hamburger_6", ($scope,$patch,EventManager_1) => {
    const EventManager = EventManager_1.EventManager;

    const OpenEvent = EventManager.register();
    const CloseEvent = EventManager.register();
    const scope = $scope;
    scope.state = 'closed';
    scope.toggle = async () => {
        if (scope.state === 'closed') {
            scope.state = 'opened';
            EventManager.dispatch(OpenEvent);
        }
        else {
            scope.state = 'closed';
            EventManager.dispatch(CloseEvent);
        }
        await $patch();
    };
    var Hamburger;
    (function (Hamburger) {
        Hamburger.events = {
            when: {
                isClickedOpen: (callback) => {
                    EventManager.subscribe(OpenEvent, callback);
                },
                isClickedClose: (callback) => {
                    EventManager.subscribe(CloseEvent, callback);
                }
            }
        };
    })(Hamburger || (Hamburger = {}));

    return {
        Hamburger: Hamburger
    }
});
app.component("CreateTour_1", (StateManager_1,$scope,ActivationEvent_1,JoinersCount_1,TourDuration_1,TourPricing_1) => {
    const StateManager = StateManager_1.StateManager;
    const ActivationEvent = ActivationEvent_1.ActivationEvent;
    const JoinersCount = JoinersCount_1.JoinersCount;
    const TourDuration = TourDuration_1.TourDuration;
    const TourPricing = TourPricing_1.TourPricing;

    const scope = $scope;
    /**
     * You can self-activate this component by subscribing to the `ActivationEvent`.
     * This event is fired after the @AppRouter component signals the page activation.
     */
    ActivationEvent.subscribe(async () => {
        await StateManager.switch('active');
        await TourDuration.render('1D1N');
        await JoinersCount.render(2);
        await TourPricing.render('0', '0');
    });
    /**
     * Expose methods that parents of `CreateTour` component
     * can make use of. These methods always return Promise.
     */
    var CreateTour;
    (function (CreateTour) {
        /**
         * Allows parent component to explicitly render the
         * `CreateTour` component.
         */
        CreateTour.render = async () => {
            await StateManager.switch('active');
        };
    })(CreateTour || (CreateTour = {}));

    return {
        CreateTour: CreateTour
    }
});
app.component("JoinersCount_1", (StateManager_1,IconButtonUI_1,$scope,$patch) => {
    const StateManager = StateManager_1.StateManager;
    const IconButtonUI = IconButtonUI_1.IconButtonUI;

    const scope = $scope;
    IconButtonUI.bind(scope, 'IconButtonHelper');
    scope.add = async () => {
        scope.value++;
        $patch('/JoinersCountEditor/Preview/');
    };
    scope.subtract = async () => {
        if (scope.value < 3)
            return;
        scope.value--;
        $patch('/JoinersCountEditor/Preview/');
    };
    /**
     * Expose methods that parents of `JoinersCount` component
     * can make use of. These methods always return Promise.
     */
    var JoinersCount;
    (function (JoinersCount) {
        /**
         * Allows parent component to explicitly render the
         * `JoinersCount` component.
         */
        JoinersCount.render = async (value) => {
            await StateManager.switch('active');
            scope.value = value;
            await StateManager.switch('active');
        };
    })(JoinersCount || (JoinersCount = {}));

    return {
        JoinersCount: JoinersCount
    }
});
app.helper("IconButtonUI_1", () => {

    var IconButtonUI;
    (function (IconButtonUI) {
        IconButtonUI.bind = (scope, key) => {
            scope[key] = {
                isActive: (value) => {
                    if (value) {
                        return '--icon-button-ui-active';
                    }
                    return '--icon-button-ui-disabled';
                }
            };
        };
    })(IconButtonUI || (IconButtonUI = {}));

    return {
        IconButtonUI: IconButtonUI
    }
});
app.component("TourDuration_1", (StateManager_1,IconButtonUI_1,$scope) => {
    const StateManager = StateManager_1.StateManager;
    const IconButtonUI = IconButtonUI_1.IconButtonUI;

    const scope = $scope;
    IconButtonUI.bind(scope, 'IconButtonHelper');
    const parseToDayNightValues = (notation) => {
        const [daystring, nNotation] = notation.split('D');
        const nightstring = nNotation.split('N')[0];
        return {
            day: parseInt(daystring),
            night: parseInt(nightstring)
        };
    };
    const createHumanReadableNotation = (days, nights) => {
        const words = {
            day: 'day',
            night: 'night'
        };
        if (days > 1) {
            words.day = `${words.day}s`;
        }
        if (nights > 1) {
            words.night = `${words.night}s`;
        }
        return `${days} ${words.day} / ${nights} ${words.night}`;
    };
    const createNotation = (days, nights) => {
        return ` ${days}D${nights}N`;
    };
    scope.subtract = async () => {
        if (scope.days < 2)
            return;
        if (scope.days === scope.nights) {
            scope.nights--;
        }
        else if (scope.days > scope.nights) {
            scope.days--;
        }
        else {
        }
        scope.humanReadable = createHumanReadableNotation(scope.days, scope.nights);
        scope.notation = createNotation(scope.days, scope.nights);
        await StateManager.switch('active');
    };
    scope.add = async () => {
        if (scope.days === scope.nights) {
            scope.days++;
        }
        else if (scope.days > scope.nights) {
            scope.nights++;
        }
        else {
        }
        scope.humanReadable = createHumanReadableNotation(scope.days, scope.nights);
        scope.notation = createNotation(scope.days, scope.nights);
        await StateManager.switch('active');
    };
    /**
     * Expose methods that parents of `TourDuration` component
     * can make use of. These methods always return Promise.
     */
    var TourDuration;
    (function (TourDuration) {
        /**
         * Allows parent component to explicitly render the
         * `TourDuration` component.
         */
        TourDuration.render = async (notation) => {
            const parsed = parseToDayNightValues(notation);
            scope.days = parsed.day;
            scope.nights = parsed.night;
            scope.notation = createNotation(scope.days, scope.nights);
            scope.humanReadable = createHumanReadableNotation(scope.days, scope.nights);
            await StateManager.switch('active');
        };
    })(TourDuration || (TourDuration = {}));

    return {
        TourDuration: TourDuration
    }
});
app.component("TourPricing_1", (IconButtonUI_1,$scope,$patch,ColorPicker_1) => {
    const IconButtonUI = IconButtonUI_1.IconButtonUI;
    const ColorPicker = ColorPicker_1.ColorPicker;

    const scope = $scope;
    IconButtonUI.bind(scope, 'IconButtonHelper');
    scope.price = {
        total: '0',
        reservation: '0',
        calculate: async () => {
            const total = parseInt(scope.price.total);
            const reservation = parseInt(scope.price.reservation);
            if (reservation > total) {
                return;
            }
            await $patch();
        }
    };
    const FullPaymentBlock = '/TourPricingEditor/FullPayment/';
    scope.FullPayment = {
        daysBeforeTrip: {
            add: async () => {
                if (scope.FullPayment.daysBeforeTrip.value > 15) {
                    return;
                }
                scope.FullPayment.daysBeforeTrip.value++;
                scope.FullPayment.daysBeforeTrip.word
                    = (scope.FullPayment.daysBeforeTrip.value > 1) ? 'days' : 'day';
                $patch(FullPaymentBlock);
            },
            subtract: async () => {
                if (scope.FullPayment.daysBeforeTrip.value < 2) {
                    return;
                }
                scope.FullPayment.daysBeforeTrip.value--;
                scope.FullPayment.daysBeforeTrip.word
                    = (scope.FullPayment.daysBeforeTrip.value > 1) ? 'days' : 'day';
                $patch(FullPaymentBlock);
            },
            value: 1,
            word: 'day'
        },
        selectOption: async (onsite) => {
            scope.FullPayment.onsite = onsite;
            $patch(FullPaymentBlock);
        },
        optionUI: {
            shouldHighlight: (isOnsite) => {
                if (isOnsite) {
                    return ColorPicker.pick('background-color-primary') ?? '';
                }
                return '';
            },
            shouldGrayout: (isOnsite) => {
                if (isOnsite) {
                    return ColorPicker.pick('color-gray-scale') ?? '';
                }
                return '';
            },
            shouldHide: (isOnsite) => {
                if (isOnsite) {
                    return '--hide-days-selector';
                }
                return '';
            }
        },
        onsite: false
    };
    /**
     * Expose methods that parents of `TourPricing` component
     * can make use of. These methods always return Promise.
     */
    var TourPricing;
    (function (TourPricing) {
        /**
         * Allows parent component to explicitly render the
         * `TourPricing` component.
         */
        TourPricing.render = async (totalPrice, reservationFee) => {
            scope.price.total = totalPrice;
            scope.price.reservation = reservationFee;
            scope.state = 'active';
            await $patch();
        };
    })(TourPricing || (TourPricing = {}));

    return {
        TourPricing: TourPricing
    }
});
app.service("ColorPicker_1", () => {

    var ColorPicker;
    (function (ColorPicker) {
        const id = 'slate_color_palette';
        ColorPicker.pick = (name) => {
            const palette = document.getElementById(id);
            if (palette === null)
                return null;
            const color = palette.querySelector(`[data-color-id="${name}"]`);
            if (color === null)
                return null;
            const classname = color.getAttribute('class');
            if (classname === null)
                return null;
            return classname.trim();
        };
    })(ColorPicker || (ColorPicker = {}));

    return {
        ColorPicker: ColorPicker
    }
});
app.component("PandoraSidebar_4", ($scope,$patch,$block,ColorPicker_1,SidebarControl_1) => {
    const ColorPicker = ColorPicker_1.ColorPicker;
    const SidebarControl = SidebarControl_1.SidebarControl;

    const scope = $scope;
    scope.selected = {
        namespace: '',
        option: ''
    };
    SidebarControl.events.when.option.preset(async (selected) => {
        const scope = $scope;
        scope.selected = selected;
        await $patch();
        setTimeout(expandNamespace, 100);
    });
    scope.select = {
        option: async (name, option) => {
            const selected = {
                namespace: name,
                option: option
            };
            scope.selected = selected;
            await $patch();
            SidebarControl.option.select(name, option);
            expandNamespace();
        }
    };
    scope.isActive = {
        option: (name, option) => {
            if (name === scope.selected.namespace && option === scope.selected.option) {
                const lightbg = ColorPicker.pick('background-color-gray-scale-extra-light');
                const darktext = ColorPicker.pick('color-elegent-dark');
                return `${lightbg}`;
            }
            return '';
        }
    };
    const expandNamespace = () => {
        $block('/PandoraSidebar/Main/', blockElement => {
            const input = blockElement.$element.querySelector(`input[value="${scope.selected.namespace}"]`);
            if (input === null)
                return;
            input.checked = true;
        });
    };
    const render = () => { };

    return {
        render: render
    }
});
