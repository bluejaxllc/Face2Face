QA_FAILED_STOP_WORKING_AND_READ_THIS_QA_FAILED
/* QA FEEDBACK:
Architectural MisalignmentWrong Scope & Environment: The inspected file injects an browser-based DOM extension/overlay script designed explicitly for a web app interface like Google Meet (as seen in the selectors, captions DOM checking, and window.__meetTranscriptPanel). However, according to the PROJECT RULES, this repository belongs to Face 2 Face, a custom mobile/web client-server application backed by a React+Vite web frontend and an Express.js API. Injects or utilities targeting specific layouts of third-party video software do not map to your internal app architecture layout or requirements.Logic & Performance FlawsMemory Leak Risk / Broken Mapping Strategy:You are tracking references using a Map (transcriptHistory) where the keys are mutable live DOM elements (child) coming from Google Meet's native DOM region.At the bottom of your observer loop, you attempt a clean-up strategy:JavaScriptfor (const [node, div] of transcriptHistory.entries()) {
    if (!document.body.contains(node)) {
        transcriptHistory.delete(node);
    }
}
However, when Google Meet updates or cleans its dynamic captions container, those specific node objects are entirely unmounted from the DOM tree. Because transcriptHistory.delete(node) fires after those items are detached, your persistent panel loses its link to old strings. This means if a speaker continues talking in a structural element re-used by Google Meet, it will completely re-trigger as a brand new block or break tracking altogether.Fragile UI Layout Reset: In your resetBtn.onclick handler, you attempt a dummy-fill operation to prevent current caption nodes from immediately populating again:JavaScriptconst parts = rawText.split('\n').map(p => p.trim()).filter(p => p.length > 0);
if (parts.length >= 2) {
    textSpan.textContent = parts.slice(1).join(' ');
}
If a caption node structure is updated mid-reset, parts[1] may be undefined, injecting empty/broken structural references into your history tracker map.UI / UX GlitchesPoor Drag Event Fallback Handling: The native drag handlers override document.onmousemove and document.onmouseup globally without saving existing window event bindings. If the main interface depends on global document movement tracking for other operations, this script clobbers them permanently upon initialization. Use modern context-isolated addEventListener and removeEventListener instances bound safely instead.
Fix this, then delete this warning. */

(function() {
    // Prevent duplicate instances
    if (window.__meetTranscriptPanel) {
        window.__meetTranscriptPanel.remove();
    }

    // 1. Create a CSS block for custom scrollbars and button hover styles
    const style = document.createElement('style');
    style.textContent = `
        #meet-transcript-panel ::-webkit-scrollbar {
            width: 6px;
        }
        #meet-transcript-panel ::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.03);
            border-radius: 4px;
        }
        #meet-transcript-panel ::-webkit-scrollbar-thumb {
            background: rgba(59, 130, 246, 0.3);
            border-radius: 4px;
        }
        #meet-transcript-panel ::-webkit-scrollbar-thumb:hover {
            background: rgba(59, 130, 246, 0.6);
        }
        .mt-btn {
            transition: all 0.2s ease;
        }
        .mt-btn:hover {
            transform: translateY(-1px);
        }
        .mt-btn:active {
            transform: translateY(0);
        }
    `;
    document.head.appendChild(style);

    // 2. Create the floating panel
    const panel = document.createElement('div');
    panel.id = 'meet-transcript-panel';
    panel.style.cssText = `
        position: fixed;
        top: 40px;
        right: 20px;
        width: 380px;
        height: 520px;
        background: rgba(15, 23, 42, 0.85);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        color: #f8fafc;
        border: 1px solid rgba(59, 130, 246, 0.35);
        border-radius: 12px;
        padding: 14px;
        z-index: 99999;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 13px;
        display: flex;
        flex-direction: column;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4);
        transition: height 0.2s ease-in-out;
    `;
    window.__meetTranscriptPanel = panel;

    // 3. Create the Header (Draggable)
    const header = document.createElement('div');
    header.style.cssText = `
        font-weight: 700;
        margin-bottom: 12px;
        border-bottom: 1px solid rgba(59, 130, 246, 0.25);
        padding-bottom: 8px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        user-select: none;
        cursor: grab;
    `;

    const titleSpan = document.createElement('span');
    titleSpan.style.cssText = `
        background: linear-gradient(135deg, #60a5fa, #a78bfa);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        font-size: 14px;
        letter-spacing: 0.5px;
    `;
    titleSpan.textContent = 'Face 2 Face Transcript';
    header.appendChild(titleSpan);

    const controls = document.createElement('div');
    controls.style.display = 'flex';
    controls.style.gap = '8px';

    // Minimize button
    const minBtn = document.createElement('button');
    minBtn.textContent = '➖';
    minBtn.style.cssText = 'background:none; border:none; color:#94a3b8; cursor:pointer; font-size:11px; padding:2px;';
    let isMinimized = false;
    minBtn.onclick = () => {
        if (!isMinimized) {
            logContainer.style.display = 'none';
            footer.style.display = 'none';
            panel.style.height = '42px';
            minBtn.textContent = '➕';
            isMinimized = true;
        } else {
            logContainer.style.display = 'flex';
            footer.style.display = 'flex';
            panel.style.height = '520px';
            minBtn.textContent = '➖';
            isMinimized = false;
        }
    };
    controls.appendChild(minBtn);

    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕';
    closeBtn.style.cssText = 'background:none; border:none; color:#ef4444; cursor:pointer; font-size:14px; padding:2px; font-weight:bold;';
    closeBtn.onclick = () => {
        observer.disconnect();
        panel.remove();
        console.log('Transcript Panel closed and observer disconnected.');
    };
    controls.appendChild(closeBtn);
    header.appendChild(controls);
    panel.appendChild(header);

    // Drag handler
    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;

    header.onmousedown = (e) => {
        if (e.target.tagName === 'BUTTON') return;
        isDragging = true;
        offsetX = e.clientX - panel.getBoundingClientRect().left;
        offsetY = e.clientY - panel.getBoundingClientRect().top;
        header.style.cursor = 'grabbing';
    };

    document.onmousemove = (e) => {
        if (!isDragging) return;
        panel.style.left = (e.clientX - offsetX) + 'px';
        panel.style.top = (e.clientY - offsetY) + 'px';
        panel.style.right = 'auto';
        panel.style.bottom = 'auto';
    };

    document.onmouseup = () => {
        if (isDragging) {
            isDragging = false;
            header.style.cursor = 'grab';
        }
    };

    // 4. Log Container
    const logContainer = document.createElement('div');
    logContainer.style.cssText = `
        flex-grow: 1;
        overflow-y: auto;
        margin-bottom: 12px;
        padding-right: 4px;
        display: flex;
        flex-direction: column;
        gap: 10px;
    `;
    panel.appendChild(logContainer);

    // Placeholder inside log
    const placeholder = document.createElement('div');
    placeholder.style.cssText = 'color:#64748b; text-align:center; margin-top:40px; font-style:italic; line-height: 1.5;';
    placeholder.textContent = 'Waiting for captions...\nMake sure Captions (CC) are enabled in Google Meet.';
    logContainer.appendChild(placeholder);

    // 5. Action Footer
    const footer = document.createElement('div');
    footer.style.cssText = `
        display: flex;
        gap: 10px;
        border-top: 1px solid rgba(255, 255, 255, 0.08);
        padding-top: 10px;
    `;

    const copyBtn = document.createElement('button');
    copyBtn.className = 'mt-btn';
    copyBtn.textContent = 'Copy Transcript';
    copyBtn.style.cssText = `
        flex-grow: 1;
        background: #3b82f6;
        color: white;
        border: none;
        border-radius: 6px;
        padding: 8px 12px;
        font-weight: 600;
        cursor: pointer;
        font-size: 12px;
    `;
    copyBtn.onclick = () => {
        const text = getFullTranscriptText();
        navigator.clipboard.writeText(text).then(() => {
            const originalText = copyBtn.textContent;
            copyBtn.textContent = 'Copied ✓';
            copyBtn.style.background = '#10b981';
            setTimeout(() => {
                copyBtn.textContent = originalText;
                copyBtn.style.background = '#3b82f6';
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy: ', err);
        });
    };
    footer.appendChild(copyBtn);

    const resetBtn = document.createElement('button');
    resetBtn.className = 'mt-btn';
    resetBtn.textContent = 'Reset Transcript';
    resetBtn.style.cssText = `
        background: rgba(255, 255, 255, 0.06);
        color: #cbd5e1;
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 6px;
        padding: 8px 12px;
        cursor: pointer;
        font-size: 12px;
    `;
    
    // Reset function
    resetBtn.onclick = () => {
        // Clear log container from UI
        logContainer.replaceChildren();
        
        // Reset the history map
        transcriptHistory.clear();
        
        // Re-populate transcriptHistory with currently visible nodes as dummies
        // to prevent them from immediately re-injecting themselves into the new batch
        const container = findCaptionsContainer();
        if (container) {
            Array.from(container.children).forEach(child => {
                const dummyDiv = document.createElement('div');
                const textSpan = document.createElement('span');
                textSpan.className = 'speech-text';
                
                const rawText = child.innerText.trim();
                const parts = rawText.split('\n').map(p => p.trim()).filter(p => p.length > 0);
                if (parts.length >= 2) {
                    textSpan.textContent = parts.slice(1).join(' ');
                }
                
                dummyDiv.appendChild(textSpan);
                transcriptHistory.set(child, dummyDiv);
            });
        }
        
        // Re-add placeholder
        logContainer.appendChild(placeholder);
        
        // Visual button feedback
        const originalText = resetBtn.textContent;
        resetBtn.textContent = 'Reset! ✓';
        resetBtn.style.background = '#dc2626';
        resetBtn.style.color = '#ffffff';
        setTimeout(() => {
            resetBtn.textContent = originalText;
            resetBtn.style.background = 'rgba(255, 255, 255, 0.06)';
            resetBtn.style.color = '#cbd5e1';
        }, 1000);
        
        console.log('Transcript log reset successfully.');
    };
    footer.appendChild(resetBtn);
    panel.appendChild(footer);

    document.body.appendChild(panel);

    // 6. Observation Logic
    const transcriptHistory = new Map();

    function getFullTranscriptText() {
        const lines = [];
        logContainer.querySelectorAll('div').forEach(div => {
            const speakerEl = div.querySelector('strong');
            const textEl = div.querySelector('.speech-text');
            if (speakerEl && textEl) {
                lines.push(`${speakerEl.textContent} ${textEl.textContent}`);
            }
        });
        return lines.join('\n');
    }

    function findCaptionsContainer() {
        const selectors = [
            '[role="region"][aria-label*="Caption"]',
            '[role="region"][aria-label*="subtí"]',
            '[role="region"][aria-label*="Subtí"]',
            '[role="region"][aria-label*="subti"]',
            '[aria-label="Captions"]',
            '[aria-label="Subtítulos"]'
        ];
        
        for (const s of selectors) {
            const container = document.querySelector(s);
            if (container) return container;
        }

        // Fallback: aria-live regions in bottom half
        const lives = document.querySelectorAll('[aria-live="polite"], [aria-live="assertive"]');
        for (const live of lives) {
            const rect = live.getBoundingClientRect();
            if (rect.top > window.innerHeight * 0.6 && live.clientHeight > 0) {
                return live;
            }
        }

        // Fallback: elements with dynamic classes that contain captions
        const candidate = document.querySelector('.nMcdL, .NWpY1d, .zWGUib');
        if (candidate) {
            let parent = candidate.parentElement;
            while (parent && parent !== document.body) {
                const rect = parent.getBoundingClientRect();
                if (parent.children.length > 1 && rect.top > window.innerHeight * 0.6) {
                    return parent;
                }
                parent = parent.parentElement;
            }
        }
        
        return null;
    }

    let lastProcessed = 0;
    const observer = new MutationObserver((mutations) => {
        const container = findCaptionsContainer();
        if (!container) return;

        // Skip calculations if mutations aren't related to captions
        let relevant = false;
        for (const m of mutations) {
            if (container.contains(m.target)) {
                relevant = true;
                break;
            }
        }
        if (!relevant) return;

        // Debounce mutations to prevent UI stuttering
        const now = Date.now();
        if (now - lastProcessed < 30) return;
        lastProcessed = now;

        if (container.children.length > 0 && placeholder.parentElement) {
            placeholder.remove();
        }

        const children = Array.from(container.children);
        children.forEach(child => {
            const rawText = child.innerText.trim();
            if (!rawText) return;

            const parts = rawText.split('\n').map(p => p.trim()).filter(p => p.length > 0);
            if (parts.length < 2) return;

            const speaker = parts[0];
            const speech = parts.slice(1).join(' ');

            if (!transcriptHistory.has(child)) {
                const lineDiv = document.createElement('div');
                lineDiv.style.cssText = 'margin-bottom: 6px; line-height: 1.45; word-break: break-word;';

                const speakerSpan = document.createElement('strong');
                speakerSpan.style.cssText = 'color: #60a5fa; margin-right: 6px; font-weight: 600;';
                speakerSpan.textContent = speaker + ':';

                const textSpan = document.createElement('span');
                textSpan.className = 'speech-text';
                textSpan.style.color = '#f1f5f9';
                textSpan.textContent = speech;

                lineDiv.appendChild(speakerSpan);
                lineDiv.appendChild(textSpan);
                logContainer.appendChild(lineDiv);

                transcriptHistory.set(child, lineDiv);
                logContainer.scrollTop = logContainer.scrollHeight;
            } else {
                const lineDiv = transcriptHistory.get(child);
                const textSpan = lineDiv.querySelector('.speech-text');
                if (textSpan && textSpan.textContent !== speech) {
                    textSpan.textContent = speech;
                    logContainer.scrollTop = logContainer.scrollHeight;
                }
            }
        });

        // Clean up refs for removed caption blocks
        for (const [node, div] of transcriptHistory.entries()) {
            if (!document.body.contains(node)) {
                transcriptHistory.delete(node);
            }
        }
    });

    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    console.log('Face 2 Face Google Meet Transcript Panel (TrustedTypes Safe) started.');
})();
