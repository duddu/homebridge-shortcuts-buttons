<div align="center">

<img src="https://github.com/duddu/homebridge-shortcuts-buttons/blob/latest/assets/icon.png?raw=true" width="180" alt="Plugin Logo" title="Homebridge Shortcuts Buttons Plugin">

<h1>Homebridge Shortcuts Buttons Plugin</h1>

[![verified-by-homebridge](https://img.shields.io/badge/homebridge-verified-7c41c9?logo=homebridge&logoColor=white)](https://github.com/homebridge/verified/wiki/Verified-Plugins)
[![NPM Version](https://img.shields.io/npm/v/homebridge-shortcuts-buttons?logo=npm&logoColor=white)](https://www.npmjs.com/package/homebridge-shortcuts-buttons/v/latest)
[![GitHub Actions Build Status](https://img.shields.io/github/actions/workflow/status/duddu/homebridge-shortcuts-buttons/build.yml?logo=github&logoColor=white)](https://github.com/duddu/homebridge-shortcuts-buttons/actions/workflows/build.yml)
[![GitHub Actions CodeQL Status](https://img.shields.io/github/actions/workflow/status/duddu/homebridge-shortcuts-buttons/codeql.yml?logo=github&logoColor=white&label=code-ql)](https://github.com/duddu/homebridge-shortcuts-buttons/actions/workflows/codeql.yml)
[![Codacy grade](https://img.shields.io/codacy/grade/677d061df63f4299bfd4d19fdd3bd1ff?logo=codacy&logoColor=white)](https://app.codacy.com/gh/duddu/homebridge-shortcuts-buttons/dashboard?utm_source=gh&utm_medium=referral&utm_campaign=Badge_grade)
[![Codacy coverage](https://img.shields.io/codacy/coverage/677d061df63f4299bfd4d19fdd3bd1ff?logo=codacy&logoColor=white)](https://app.codacy.com/gh/duddu/homebridge-shortcuts-buttons/coverage/dashboard?utm_source=gh&utm_medium=referral&utm_campaign=Badge_coverage)
[![semantic-release: angular](https://img.shields.io/badge/semantic--release-angular-e10079?logo=semantic-release&logoColor=white)](https://github.com/semantic-release/semantic-release)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-green.svg?logo=conventionalcommits&logoColor=white)](http://commitizen.github.io/cz-cli/)
[![Dependabot](https://img.shields.io/badge/dependabot-2b64cf?logo=dependabot&logoColor=white)](https://github.com/duddu/homebridge-shortcuts-buttons/pulls?q=author%3Aapp%2Fdependabot)

</div>

### Features highlights

- Run your **Apple Shortcuts** directly from your **Home app** (or any HomeKit compatible integration).
- Optionally, choose a **custom callback command** (even another shortcut) to execute once your shortcut completes (success/failure/cancel), leveraging an integrated **x-callback-url server**.
- Choose to display your shortcuts buttons as **Outlets** or **Switches**.
- All via UI plugin configuration, no other setup required.
- Super fast and light, zero runtime package dependencies.

### Apple Home examples

The following screenshots give a preview of what this plugin may produce in the Home app - depending on whether you decide to display the shortcuts buttons as _Outlets_ or _Switches_ (see [configuration](#configuration)), and on the _Show as single tile / separate tiles_ option in the Accessory Settings.

<img src="https://github.com/duddu/homebridge-shortcuts-buttons/blob/latest/assets/demo-outlets-single-tile-room-view.png?raw=true" alt="Apple Home demo outlets single tile room view" title="Outlets - Show as single tile - Room view" width="24%"><img src="https://github.com/duddu/homebridge-shortcuts-buttons/blob/latest/assets/transparent-square.png?raw=true" alt="separator" width="1.33%"><img src="https://github.com/duddu/homebridge-shortcuts-buttons/blob/latest/assets/demo-outlets-single-tile-accessory-view.png?raw=true" alt="Apple Home demo outlets single tile accessory view" title="Outlets - Show as single tile - Accessory view" width="24%"><img src="https://github.com/duddu/homebridge-shortcuts-buttons/blob/latest/assets/transparent-square.png?raw=true" alt="separator" width="1.33%"><img src="https://github.com/duddu/homebridge-shortcuts-buttons/blob/latest/assets/demo-switches-separate-tiles-room-view.png?raw=true" alt="Apple Home demo switches separate tiles room view" title="Switches - Show as separate tiles - Room view" width="24%"><img src="https://github.com/duddu/homebridge-shortcuts-buttons/blob/latest/assets/transparent-square.png?raw=true" alt="separator" width="1.33%"><img src="https://github.com/duddu/homebridge-shortcuts-buttons/blob/latest/assets/demo-switches-single-tile-accessory-view.png?raw=true" alt="Apple Home demo switches single tile accessory view" title="Switches - Show as single tile - Accessory view" width="24%">

> <small>_Bear in mind that in order to obtain a result similar to the screenshots above, you may have to add a few shortcuts buttons in the config first. E.g. by default Apple Home won't display the cute "power on" round button for a single outlet service, rather will display it instead as an actual outlet on the room view and as a switch on the accessory view._</small>

## How it works

1. When you tap the button/switch, the plugin executes a command on the machine where Homebridge is running which runs the relevant Apple Shortcut. The button/switch then automatically toggles back off after a moment.<br>

   > _There are no restrictions on the content of the shortcuts to run, including ones running scripts over SSH on other hosts. The plugin has no role in this, as it only instructs Shortcuts to run them via native url schema._

2. If you left enabled the option `Enable Callback Command` (see description [below](#configuration)), the plugin will inform Shortcuts to give a signal back once the shortcut execution is completed.

   > _This is done using the [x-callback-url](https://x-callback-url.com) standard, which effectively appends to the shortcut execution request the instructions on what to do when it succeds, fails, or is canceled._

3. Once the shortcut has run, Shortcuts will invoke a callback in this plugin, indicating the status of the execution and the result if any. When the plugin receives the callback request it runs the relevant command (either the default callback command or a custom one if provided, see [below](#callback-command)).

   > _This is possible because the plugin includes a very light http server running locally within Homebridge, which receives the callback from Shortcuts and determines the next command to run. The two actors in the data flow are independent and communicate only via url schemas; this removes the need for any active polling or scheduled tasks. Also, the plugin's server issues a dedicated single-use authorization token for each interaction with Shortcuts, making it more difficult for things to get messy._

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
| Enable Callback Command | `boolean` | `true` | Whether the plugin should execute a command once a shortcut run completes. This determines whether to run an internal x-callback-url http server in the background.<br>All fields below depend on this one: any value inserted in the following fields will be ignored if this one value is set to false. |
| Callback Command Type | `"Default (display notification)" \| "Custom unix command" \| "Shortcut name"` | `"Default (display notification)"` | With the default option, after the shortcut completion, a notification with the outcome of the shortcut run is displayed on the host running Homebrige.<br>If you choose to customize the callback behaviour, you have two choices: use any unix command that your host is able to execute, or just use another shortcut to handle the callback if you like. Depending on which choice you make, you'll have to fill in the next field accordingly.<br>Please consult the dedicated documentation for more detail: <a href="https://github.com/duddu/homebridge-shortcuts-buttons/blob/latest/README.md#callback-command">Callback command</a>. |
| Callback Custom Command | `string` | - | Either a unix command or the name of a shortcut to run, depending on the value selected in the previous field. In the former case, all the content of the field will be treated as a command and executed: in the latter, this field expects just the plain name of the shortcut as displayed in the Shortcuts app. If you left the previous field on the default value, any text inserted here will be ignored.<br>Please consult the dedicated documentation for more details also regarding the runtime variables available during your command/shortcut execution: <a href="https://github.com/duddu/homebridge-shortcuts-buttons/blob/latest/README.md#callback-command">Callback command</a>. |
| Callback Command Timeout | `number` | `5000` | The time in milliseconds that the x-callback-url server should wait for the callback command execution to complete before timing out. Note: this matters only in case of custom callback command; if you chose a shortcut, the actual command executed is only the launch of it, the run itself is indipendent from the plugin. |
| Callback Server Hostname | `string` | `"127.0.0.1"` | IPv4 address or hostname to expose the internal x-callback-url http server (must be accessible from a browser on the machine running Homebridge). |
| Callback Server Port | `number` | `63963` | A free port number to be used by the internal x-callback-url http server. |
| Callback Server Protocol | `"http" \| "https"` | `"http"` | If you access other Homebridge services (e.g. UI) behind a reverse proxy with TLS certificate installed, you may want to access the x-callback-url server via https as well. |

<!-- %COMPILED_CONFIG_END% -->

## Callback command

As mentioned in the configuration documentation above, there are three options available to handle the callback following a shortcut execution:

### Default (display notification)

By default, a native notification with a brief summary on the shortcut result is displayed on the host machine running Homebrige (with sound effect _Glass_ for success and _Sosumi_ for failure). The handler for this behaviour is delivered as [HomebridgeShortcutsButtons - Notify Shortcut Result.app](https://github.com/duddu/homebridge-shortcuts-buttons/tree/latest/src/bin/HomebridgeShortcutsButtons%20-%20Notify%20Shortcut%20Result.app) (which is copied into the `/bin` directory of the distributed npm package).  
For it to run you will have to approve a couple of permissions requests the first time it runs (one to display notifications, one to access shortcuts results in order to print the summary in the notification body).

### Custom unix command

If you choose to manually write a custom callback script, everything you input in the command field will be passed over to node `child_process.exec`, which will try to execute it in a subshell. Your input can be directly some inline code, or it can be code that runs a file on your machine containing a more elaborate script.  
The `stdout`/`stderr` generated by your command will be propagated onto the top shell (respectively with `Logger.debug`/`error`) which is buffered on your Homebridge UI.  

#### Environment variables

In your command you have at your disposal the following **environment variables** which give you contextual information about the shortcut which triggered the callback:

| Variable        | Type                               | Notes                    | 
| :---------------| :--------------------------------- | :----------------------- |
| SHORTCUT_NAME   | `string`                           | Name of the run shortcut |
| SHORTCUT_STATUS | `"success" \| "error" \| "cancel"` | Cancel: manually stopped |
| SHORTCUT_RESULT | `string \| undefined`              | Only on success status   |
| SHORTCUT_ERROR  | `string \| undefined`              | Only on error status     |

### Shortcut

For some it might be easier to just use another shortcut to handle the actions to perform on completion of the initial shortcuts configured to run on buttons press. You could even have the same shortcut handling its own error status, for example in case of operation that can be retried (and with the input variables provided - see below - it would be easy to distinguish a standard run from a retry one, for instance). Just be wary of infinite loops.  
Remember to only insert in the custom command field the shortcut name as it appears in the Shortcuts app, same as for the shortcuts names configured for the homekit buttons above.

When it comes to passing relevant variables to the callback shortcut, the situation it's not as easy as the previous case. Shortcuts only accept one single text input when called via url schema. Luckily, we can **encode a dictionary** (base_64) of the variables on the server so it can be passed as a single input parameter to the shortcut. Then from there we can decode it and transform it back into a dictionary ready for consumption within the callback shortcut. Here is an example of shortcut with the mentioned steps:

<img src="https://github.com/duddu/homebridge-shortcuts-buttons/blob/latest/assets/demo-callback-shortcut-with-input.png?raw=true" width="100%" alt="Demo callback shortcut with input" title="Demo callback shortcut with input">

The key point is to add first the _Get text from input_ action, specifying _Shortcut Input_ as source. This will automatically add the _Receive_ block on top. Note that it is perfectly fine and expected to leave the instruction as _Receive No input from Nowhere_: the text input coming from url schema will still be passed in.  
I included in the repository a **copy of the same shortcut screenshotted above** for your convenience, you can download it here: [Demo callback shortcut with input.shortcut](https://github.com/duddu/homebridge-shortcuts-buttons/raw/latest/assets/Demo%20callback%20shortcut%20with%20input.shortcut), and inspect it or import it into your Shortcuts to have a starting point.

#### Shortcut input variables

After the decoding of the dictionary, you'll have your clear variables to access within your shortcut actions; the typing is the following (similar to the environment variables provided to the custom callback command, except for having to replace `undefined` - unsupported by shortcuts dictionaries - with `false`):

| Variable        | Type                               | Notes                    | 
| :---------------| :--------------------------------- | :----------------------- |
| SHORTCUT_NAME   | `string`                           | Name of the run shortcut |
| SHORTCUT_STATUS | `"success" \| "error" \| "cancel"` | Cancel: manually stopped |
| SHORTCUT_RESULT | `string \| false`                  | Only on success status   |
| SHORTCUT_ERROR  | `string \| false`                  | Only on error status     |

## Requirements

- MacOS 12+ (Monterey or later)
- The shortcuts you want to run must be accessible from the machine where Homebridge is running, e.g. by having the host logged into the relevant iCloud account.

#### NPM Engines

- `node ^18.17.0 || ^20.9.0`
- `homebridge ^1.6.0`

## Development

Please feel free to open PRs from forked repo against the `latest` branch, I'll do my best to have a look asap. The plugin is pretty extensible and there are plenty of potential easy enhancements to make in case people find it useful.

Main npm scripts for local development:

```shell
npm install # Install dev dependencies
npm run test # Run unit tests with Jest
npm run build # Build the plugin
npm run watch # Run homebridge in background and build on changes
npm run convertSchema # Generate new config ts+md from schema json

```

### Semantic release and conventional changelog

This repo uses [semantic-release](https://github.com/semantic-release/semantic-release) to publish github releases and npm packages. Among the other things, it perform commits analysis in order to determine when a new release is needed, so it's important that all commits messages follow the conventional-changelog syntax.
To facilitate this, the repo enforces the use of [commitizen](https://github.com/commitizen/cz-cli) locally, via [husky](https://typicode.github.io/husky) `prepare-commit-msg` hook.