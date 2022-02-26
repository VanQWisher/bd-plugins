/**
 * @name FakeMuteDeafen
 * @author Ryan.js
 * @authorId 154408842954801152
 * @version 2.0.0
 * @description Trick Discord into thinking you are muted or deafened when you're in VC.
 */

module.exports = (() => {
	const config = {
		main: 'index.js',
		info: {
			name: 'FakeMuteDeafen',
			authors: [{
				name: 'Ryan.js',
				discord_id: '154408842954801152',
				github_username: 'VanQWisher'
			}],
			authorLink: 'https://github.com/vanqwisher',
			version: '2.0.0',
			description: "Trick Discord into thinking you are muted or deafened when you're in VC.",
			github: 'https://github.com/vanqwisher/bd-plugins',
		},
		changelog: [
			{
				title: 'Credits',
				type: 'improved',
				items: ['*Thanks ali0sam for the orginal script. I will keep the legacy going!*']
			},
			{
				title: "Note",
				type: 'fixed',
				items: ['Mobile users will always see you talking in a muted state.\nThere is no way around this.']
			},
			{
				title: "What's new in V 2.0",
				type: 'added',
				items: ['Display tutorial on startup.', 'Toggleable fake mute button near mute/deafen buttons.', 'Added settings pannel for toasts and tutorial.']
			},
			{
				title: "Want to help?",
				type: 'progress',
				items: ['Feel free to join my server https://discord.gg/zDQJD2ZEb8']
			},
		],
		defaultConfig: [
			{
				type: 'switch',
				id: 'tutorial',
				name: 'Tutorial',
				note: 'Displays how to use the plugin.',
				value: true
			},
			{
				type: 'switch',
				id: 'enableToasts',
				name: 'Enable Toasts',
				note: 'Show Toasts when you turn fake mode on/off the plugin.',
				value: true
			}]
	};
	return !global.ZeresPluginLibrary ? class {
		constructor() { this._config = config; }
		getName() { return config.info.name; }
		getAuthor() { return config.info.authors.map(a => a.name).join(", "); }
		getDescription() { return config.info.description; }
		getVersion() { return config.info.version; }
		load() {
			BdApi.showConfirmationModal("Library Missing", `The library plugin needed for ${config.info.name} is missing. Please click Download Now to install it.`, {
				confirmText: "Download Now",
				cancelText: "Cancel",
				onConfirm: () => {
					require("request").get("https://rauenzi.github.io/BDPluginLibrary/release/0PluginLibrary.plugin.js", async (error, response, body) => {
						if (error) return require("electron").shell.openExternal("https://betterdiscord.net/ghdl?url=https://raw.githubusercontent.com/rauenzi/BDPluginLibrary/master/release/0PluginLibrary.plugin.js");
						await new Promise(r => require("fs").writeFile(require("path").join(BdApi.Plugins.folder, "0PluginLibrary.plugin.js"), body, r));
					});
				}
			});
		}
		start() { }
		stop() { }
	} : (([Plugin, Api]) => {
		const plugin = (Plugin, Library) => {
			const { Patcher, Toasts } = Library;
			return class FakeMuteDeafen extends Plugin {
				onStart() {
					if (this.settings.tutorial) {
						BdApi.showConfirmationModal("Tutorial", "> **Enable Fake Mode**\n\n`1.` Mute or deafen.\n\n`2.` Turn on the button.\n\n`3.` Unmute or undeafen.\n\n > **Disable Fake Mode**\n\n`1.` Mute or deafen. *When you turned on the button.*\n\n`2.` Turn off the button.\n\n`3.` Unmute or undeafen.", {
							confirmText: "Don't show again",
							onConfirm: () => {
								this.settings.tutorial = false;
								this.saveSettings();
							}
						});
					}
					let PanelButton = BdApi.findModuleByDisplayName("PanelButton")
					let node = BdApi.getInternalInstance(document.querySelector(".panels-3wFtMD > .container-YkUktl")).return?.stateNode
					let enabled = false;
					this.stop = addButton();
					function addButton() {
						// Patch
						const res = BdApi.Patcher.after("FakeMuteDeafen", node.__proto__, "render", (_, __, { props }) => {
							// Add button
							props.children[2].props.children.unshift(BdApi.React.createElement(PanelButton, {
								icon: () => enabled ? "On" : "Off",
								tooltipText: enabled ? "Disable Fake Mute" : "Enable Fake Mute",
								onClick: () => {
									if (enabled) {
										enabled = false;
										WebSocket.prototype.send = WebSocket.prototype.original;
										Toasts.show("Fake Mute Disabled!", { type: "info", timeout: 3000 });
									} else {
										enabled = true;
										let text = new TextDecoder("utf-8");
										WebSocket.prototype.original = WebSocket.prototype.send;
										WebSocket.prototype.send = function (data) {
											if (Object.prototype.toString.call(data) === "[object ArrayBuffer]") {
												if (text.decode(data).includes("self_deaf")) {
													data = data.replace('"self_mute":false', 'NiceOneDiscord');
												}
											}
											WebSocket.prototype.original.apply(this, [data]);
										}
										Toasts.show("Fake Mute Enabled!", { type: "warning", timeout: 3000 });
									}
								}
							}))
						})
						// Rerender
						node.forceUpdate()
						return () => {
							res()
							node.forceUpdate()
						}
					}
				}
				onStop() {
					Patcher.unpatchAll();
				}
				getSettingsPanel() {
					const panel = this.buildSettingsPanel();
					return panel.getElement();
				}
			};
		};
		return plugin(Plugin, Api);
	})(global.ZeresPluginLibrary.buildPlugin(config));
})();
/*@end@*/