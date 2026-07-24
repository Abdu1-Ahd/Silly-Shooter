# YouTube Playables Requirements

This document outlines the technical, visual, and policy requirements for publishing our game on YouTube Playables. 

## 1. Access and Platform Setup
* Access to the YouTube Playables Developer Portal is required.
* The publishing account needs Editor or Manager permissions on an onboarded YouTube Channel.
* Independent submissions require an invitation or partnership with an approved publisher.

## 2. Technical Specifications
* Build the game using web-native technologies like HTML5, Canvas, or WebGL.
* Package the entire game as a single ZIP file.
* Place the `index.html` file at the root of the ZIP directory.
* Keep the initial load size under 30 MB.
* Keep individual file sizes under 30 MB.
* Keep the total ZIP file size under 200 MB.
* Do not make external network requests. Fetching assets or scripts from third-party servers is strictly prohibited. The game must run completely offline within the YouTube sandbox.

## 3. SDK Integration
Our code must integrate directly with the YouTube Playables SDK.

* `gameReady()`: Call this method only after all assets and UI load. The player must be able to interact immediately.
* Pause and Resume: Listen to platform signals. Pause gameplay, rendering, and timers instantly when instructed by the system.
* Audio: Synchronize game audio with YouTube system mute controls.
* Cloud Saves: Use the native YouTube storage mechanisms for saving player progress. Do not use custom backend databases for save states.

## 4. Visual and UI Design
* Support all aspect ratios dynamically. The game must look correct on 16:9, 9:16, 1:1, and 4:3 screens.
* Do not stretch graphics or blur text.
* Do not lock the device orientation. The game must adapt to screen rotation.
* Avoid placing important UI elements near the top edges to prevent overlapping with YouTube native controls.
* Do not include custom "Exit", "Close", or "Quit" buttons. YouTube handles application closure.
* Include keyboard support for desktop users. Allow users to close menus or popups using the `Esc` key.

## 5. Content Policies
* Remove all external links. Do not link to our website, Discord, or app stores.
* Do not include custom terms of service, privacy policies, or End User License Agreements.
* Do not include account login screens.
* Remove all in-game social sharing buttons.
* Ensure thumbnails and promotional metadata are clean and lack third-party logos.