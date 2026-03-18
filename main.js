document.addEventListener('DOMContentLoaded', () => {
    const gridSize = 5;
    const gridEl = document.getElementById('grid');

    // State variables
    let state = {
        start: [0, 0],
        end: [4, 4],
        blocks: [[1, 1], [2, 2], [3, 3]],
        values: Array(gridSize).fill().map(() => Array(gridSize).fill(0)),
        policy: Array(gridSize).fill().map(() => Array(gridSize).fill(null)),
        hasCalculated: false
    };

    let currentTool = 'none';
    let viewMode = 'values'; // 'values' or 'policy'

    // Initialize Grid UI
    function initGrid() {
        gridEl.innerHTML = '';
        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.r = r;
                cell.dataset.c = c;

                // Add value/arrow containers
                const valSpan = document.createElement('span');
                valSpan.className = 'cell-value';
                const arrowSpan = document.createElement('span');
                arrowSpan.className = 'cell-arrow';

                cell.appendChild(valSpan);
                cell.appendChild(arrowSpan);

                cell.addEventListener('click', () => handleCellClick(r, c));
                gridEl.appendChild(cell);
            }
        }
        updateGridRendering();
    }

    // Update cell classes based on state
    function updateGridRendering() {
        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                const cell = getCell(r, c);
                // Reset classes
                cell.className = 'cell';
                const isStart = state.start[0] === r && state.start[1] === c;
                const isEnd = state.end[0] === r && state.end[1] === c;
                const isBlock = state.blocks.some(b => b[0] === r && b[1] === c);

                if (isStart) cell.classList.add('start');
                else if (isEnd) cell.classList.add('end');
                else if (isBlock) cell.classList.add('block');

                // Update text/arrow
                const valSpan = cell.querySelector('.cell-value');
                const arrowSpan = cell.querySelector('.cell-arrow');

                valSpan.style.display = 'none';
                arrowSpan.style.display = 'none';

                if (!isBlock) {
                    if (state.hasCalculated) {
                        if (viewMode === 'values') {
                            valSpan.style.display = 'block';
                            valSpan.textContent = state.values[r][c].toFixed(2);
                        } else if (viewMode === 'policy') {
                            if (isEnd) {
                                arrowSpan.innerHTML = '<i class="fa-solid fa-bullseye"></i>';
                            } else if (state.policy[r][c]) {
                                const arrowMap = {
                                    'UP': 'fa-arrow-up',
                                    'DOWN': 'fa-arrow-down',
                                    'LEFT': 'fa-arrow-left',
                                    'RIGHT': 'fa-arrow-right'
                                };
                                arrowSpan.innerHTML = `<i class="fa-solid ${arrowMap[state.policy[r][c]]}"></i>`;
                            } else {
                                arrowSpan.innerHTML = '';
                            }
                            arrowSpan.style.display = 'block';
                        }
                    } else if (isStart) {
                        valSpan.style.display = 'block';
                        valSpan.innerHTML = "S";
                    } else if (isEnd) {
                        valSpan.style.display = 'block';
                        valSpan.innerHTML = "G";
                    }
                }
            }
        }
    }

    function getCell(r, c) {
        return document.querySelector(`.cell[data-r="${r}"][data-c="${c}"]`);
    }

    // Handle tool clicks
    const tools = document.querySelectorAll('.tool-btn');
    tools.forEach(btn => {
        btn.addEventListener('click', () => {
            tools.forEach(t => t.classList.remove('active'));
            btn.classList.add('active');
            currentTool = btn.dataset.tool;
        });
    });

    // Handle view mode toggles
    const viewValuesBtn = document.getElementById('viewValuesBtn');
    const viewPolicyBtn = document.getElementById('viewPolicyBtn');

    viewValuesBtn.addEventListener('click', () => {
        viewMode = 'values';
        viewValuesBtn.classList.add('active');
        viewPolicyBtn.classList.remove('active');
        updateGridRendering();
    });

    viewPolicyBtn.addEventListener('click', () => {
        viewMode = 'policy';
        viewPolicyBtn.classList.add('active');
        viewValuesBtn.classList.remove('active');
        updateGridRendering();
    });

    // Handle cell clicks for grid editing
    function handleCellClick(r, c) {
        // Reset calculated state if grid is modified
        state.hasCalculated = false;

        const isBlockIdx = state.blocks.findIndex(b => b[0] === r && b[1] === c);

        if (currentTool === 'start') {
            if (isBlockIdx !== -1) return; // Prevent start on block
            state.start = [r, c];
            if (state.end[0] === r && state.end[1] === c) state.end = [-1, -1];
        } else if (currentTool === 'end') {
            if (isBlockIdx !== -1) return; // Prevent end on block
            state.end = [r, c];
            if (state.start[0] === r && state.start[1] === c) state.start = [-1, -1];
        } else if (currentTool === 'block') {
            if (state.start[0] === r && state.start[1] === c) return;
            if (state.end[0] === r && state.end[1] === c) return;

            if (isBlockIdx !== -1) {
                state.blocks.splice(isBlockIdx, 1);
            } else {
                state.blocks.push([r, c]);
            }
        }
        updateGridRendering();
    }

    // Run Value Iteration via API
    document.getElementById('runBtn').addEventListener('click', async () => {
        if (state.start[0] === -1 || state.end[0] === -1) {
            alert("Please set both a start and an end state.");
            return;
        }

        const runBtn = document.getElementById('runBtn');
        const ogHtml = runBtn.innerHTML;
        runBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Calculating...';
        runBtn.disabled = true;

        try {
            const response = await fetch('/api/value_iteration', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    grid_size: gridSize,
                    start: state.start,
                    end: state.end,
                    blocks: state.blocks
                })
            });

            if (!response.ok) throw new Error("API Request Failed");

            const data = await response.json();
            state.values = data.values;
            state.policy = data.policy;
            state.hasCalculated = true;

            updateGridRendering();
        } catch (error) {
            console.error(error);
            alert("Error running value iteration. Is the Flask server running?");
        } finally {
            runBtn.innerHTML = ogHtml;
            runBtn.disabled = false;
        }
    });

    document.getElementById('resetBtn').addEventListener('click', () => {
        state = {
            start: [0, 0],
            end: [4, 4],
            blocks: [[1, 1], [2, 2], [3, 3]],
            values: Array(gridSize).fill().map(() => Array(gridSize).fill(0)),
            policy: Array(gridSize).fill().map(() => Array(gridSize).fill(null)),
            hasCalculated: false
        };
        updateGridRendering();
    });

    // Initialize
    initGrid();
});
