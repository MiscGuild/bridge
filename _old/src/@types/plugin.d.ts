// src/@types/plugin.d.ts
declare interface Plugin {
    /** Unique plugin identifier */
    id: string;

    /** Human-readable plugin name */
    name: string;

    /** Plugin version */
    version: string;

    /** Plugin description */
    description: string;

    /** Plugin author */
    author?: string;

    /** Dependencies on other plugins */
    dependencies?: string[];

    /** Whether plugin is enabled by default */
    enabled?: boolean;

    /** Configuration schema for the plugin */
    configSchema?: any;

    /** Plugin initialization function */
    init?: (bridge: import('../bridge').default, config?: any) => Promise<void> | void;

    /** Plugin cleanup function */
    destroy?: (bridge: import('../bridge').default) => Promise<void> | void;

    /** Events directory path (relative to plugin root) */
    eventsDir?: string;

    /** Commands directory path (relative to plugin root) */
    commandsDir?: string;

    /** Patterns directory path (relative to plugin root) */
    patternsDir?: string;

    /** Custom initialization logic */
    onEnable?: (bridge: import('../bridge').default) => Promise<void> | void;

    /** Custom cleanup logic */
    onDisable?: (bridge: import('../bridge').default) => Promise<void> | void;
}
