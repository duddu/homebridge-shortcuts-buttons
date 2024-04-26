<img src="https://github.com/duddu/homebridge-shortcuts-buttons/blob/latest/assets/banner.png?raw=true" width="100%" alt="Homebridge Shortcuts Buttons" title="Homebridge Shortcuts Buttons">

# Homebridge Shortcuts Buttons Plugin

<!-- [![verified-by-homebridge](https://badgen.net/badge/homebridge/verified/purple)](https://github.com/homebridge/homebridge/wiki/Verified-Plugins) -->

### Features highlights

- Run your **Apple Shortcuts** directly from your **Home app** (or any HomeKit compatible integration).
- Optionally, choose a **custom callback command** to execute once the shortcut completes (success/failure/cancel), leveraging an integrated **x-callback-url server**.
- Choose to display your shortcuts buttons as **Outlets** or **Switches**.
- All via UI plugin configuration, no other setup required.
- Super fast and light, zero runtime package dependencies.

### Apple Home preview

<img src="https://github.com/duddu/homebridge-shortcuts-buttons/blob/latest/assets/demo-outlets-single-tile.jpeg?raw=true" width="30%" alt="Demo outlets single tile" title="(a) Outlets - single tile - accessory view">&ensp;
<img src="https://github.com/duddu/homebridge-shortcuts-buttons/blob/latest/assets/demo-switches-single-tile.jpeg?raw=true" width="30%" alt="Demo switches single tile" title="(b) Switches - single tile - accessory view">&ensp;
<img src="https://github.com/duddu/homebridge-shortcuts-buttons/blob/latest/assets/demo-switches-separate-tiles.jpeg?raw=true" width="30%" alt="Demo switches separate tiles" title="(c) Switches - separate tiles - room view">

<small>a) Outlets, single tile, accessory view&ensp;-&ensp;b) Switches, single tile, accessory view&ensp;-&ensp;c) Switches, separate tiles, room view.</small>

> <small>_Bear in mind that in order to obtain same screens as above, you may have to add a few shortcuts buttons in the config. E.g. by default, Apple Home won't display the "power on" button - as in (a) - for a single service, but rather display it as an outlet on the room view and as a switch on the accessory view._</small>

## How it works

1. When you tap the button/switch, the plugin executes a command on the machine where Homebridge is running which runs the relevant Apple Shortcut. The button/switch then automatically toggles back off after a moment.<br>

   > _There are no restrictions on the content of the shortcuts to run, including ones running scripts over SSH on other hosts. The plugin has no role in this, as it only instructs Shortcuts to run them via native url schema._

2. If you left enabled the option `Enable Callback Command` (see description [below](#configuration)), the plugin will inform Shortcuts to give a signal back once the shortcut execution is completed.

   > _This is done using the [x-callback-url](https://x-callback-url.com) standard, which effectively appends to the shortcut execution request the instructions on what to do when it succeds, fails, or is canceled._

3. Once the shortcut has been executed the plugin receives the callback and, depending on the status of the shortcut execution, runs the relevant command (either the default callback command or a custom one if provided, see [below](#callback-command)).

   > _This is possible because the plugin includes a (very light) http server running locally within Homebridge, which receives the callback from Shortcuts and determines the next command to run._

## Configuration

<!-- %COMPILED_CONFIG_START% (Auto-generated, do not edit manually) -->

| Field | Type | Default | Description |
| :- | :- | :- | :- |
| Name | `string` | `"Homebridge Shortcuts Buttons"` | Name of the platform bridge. |
| Accessory Name | `string` | `"Shortcuts"` | Display name of the accessory. |
| Display buttons as | `"Outlet" \| "Switch"` | `"Outlet"` | Display the buttons services as outlets or as switches. |
| Buttons | `array` | - | List of buttons configuration objects. |
| &ensp;↳ Button name | `string` | - | A name to display for this button. |
| &ensp;↳ Shortcut name | `string` | - | Name of the Apple Shortcut to trigger, as displayed in the Shortcuts app. The machine running Homebridge must have access to it (i.e. be logged to the correct iCloud account). |
| Enable Callback Command | `boolean` | `true` | Whether the plugin should execute a command once a shortcut run completes. This determines whether to run an internal x-callback-url http server in the background.<br>All fields below depend on this one: any value inserted in the following inputs will be ignored if this one field is set to false. |
| Callback Server Hostname | `string` | `"127.0.0.1"` | IP address or hostname to expose the internal x-callback-url http server (must be accessible from a browser on the machine running Homebridge). |
| Callback Server Port | `number` | `63963` | A free port number to be used by the internal x-callback-url http server. |
| Callback Server Protocol | `"http" \| "https"` | `"http"` | If you access other Homebridge services (e.g. UI) behind a reverse proxy with TLS certificate installed, you may want to access the x-callback-url server via https as well. |
| Callback Custom Command | `string` | - | By default, after the shortcut completion, a notification with a brief summary is displayed on the host running Homebrige (with sound 'Glass' for success and 'Sosumi' for failure).<br><br>If you input any value here it will be treated as a unix command and executed via node's `child_process.exec` (at your own risk).<br>In your command you have at your disposal the following environment variables:<br>- SHORTCUT_NAME: `string`<br>- SHORTCUT_RESULT: `"success" \| "error" \| "cancel"` |
| Callback Command Timeout | `number` | `5000` | The time in milliseconds that the x-callback-url server should wait for the callback command execution to complete before timing out. |

<!-- %COMPILED_CONFIG_END% -->

## Callback command

By default, after the shortcut completes, a notification with a brief summary is displayed on the host machine running Homebrige (with native sound effect _Glass_ for success and _Sosumi_ for failure). The script handling this default behaviour is delivered as [HomebridgeShortcutsButtons - Notify Shortcut Result.app](https://github.com/duddu/homebridge-shortcuts-buttons/tree/latest/src/bin/HomebridgeShortcutsButtons%20-%20Notify%20Shortcut%20Result.app). You will have to approve two permissions request the first time it runs (one for controlling Safari to display the notification, and one to access shortcuts results, in order to print a shortcut results summary in the notification).

If any input is provided in the _Callback Custom Command_ configuration field, it will be treated as a unix command and executed via node's `child_process.exec` (at your own risk).
In your command you have at your disposal the following environment variables:

| Variable          | Type                               |
| :---------------- | :--------------------------------- |
| `SHORTCUT_NAME`   | `string`                           |
| `SHORTCUT_RESULT` | `"success" \| "error" \| "cancel"` |

## Development

Please feel free to open PRs from forked repo against the `latest` branch, I'll do my best to have a look asap. The plugin is pretty extensible and there are plenty of potential easy enhancements to make in case people find it useful.

Main npm scripts for local development:

```shell
npm install # Install dev dependencies
npm run test # Run unit tests with Jest
npm run build # Build the plugin
npm run watch # Run homebridge in background and build on changes
npm run convertSchema # Generate new config interface from schema json

```

### Semantic release and conventional changelog

This repo uses [semantic-release](https://github.com/semantic-release/semantic-release) to publish github releases and npm packages. Among the other things, it perform commits analysis in order to determine when a new release is needed, so it's important that all commits messages follow the conventional-changelog syntax.
To facilitate this, the repo supports the use of [commitizen](https://github.com/commitizen/cz-cli), which you can use this way:

```shell
npm install -g commitizen
git cz # instead of git commit

# OR (to avoid global dependencies)

npx cz
```

## Homebridge plugin verification

I just made the repo public and submitted the request to mark the plugin as verified by Homebridge. So till the process completes it's expected to see the plugin as unverified on the Homebridge GUI.
