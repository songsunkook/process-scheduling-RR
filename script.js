let processCount = 0;

// 프로세스를 추가하는 함수
function addProcess() {
    processCount++;
    const processEntries = document.getElementById('process-entries');

    // 새로운 프로세스 입력 요소를 생성하여 추가
    const processEntry = document.createElement('div');
    processEntry.className = 'process-entry';
    processEntry.innerHTML = `
        <span>P${processCount}</span>
        <input type="number" min="0" placeholder="Arrival Time">
        <input type="number" min="1" placeholder="Burst Time">
    `;
    processEntries.appendChild(processEntry);
}

// 프로세스 도착 시간과 버스트 시간을 랜덤하게 설정하는 함수
function randomizeValues() {
    const entries = document.querySelectorAll('.process-entry');
    entries.forEach(entry => {
        const arrival = entry.children[1];
        const burst = entry.children[2];
        arrival.value = Math.floor(Math.random() * 11);
        burst.value = Math.floor(Math.random() * 10) + 1;
    });
}

// 시뮬레이션을 실행하는 함수
function runSimulation() {
    const delta = parseInt(document.getElementById('delta').value);
    if (isNaN(delta)) {
        alert('Delta must be an integer');
        return;
    }

    const processes = [];
    const entries = document.querySelectorAll('.process-entry');
    entries.forEach((entry, index) => {
        const pid = `P${index + 1}`;
        const arrival = parseInt(entry.children[1].value);
        const burst = parseInt(entry.children[2].value);
        if (isNaN(arrival) || isNaN(burst)) {
            alert('Arrival and Burst times must be integers');
            return;
        }
        processes.push({ pid, arrival, burst });
    });

    simulateRR(processes, delta);
}

// Round Robin 스케줄링 알고리즘을 시뮬레이션하는 함수
function simulateRR(processes, delta) {
    processes.sort((a, b) => a.arrival - b.arrival);

    const queue = [];
    const ganttChart = [];
    let time = 0;
    const waitTime = {};
    const remainingTime = {};
    const arrivalDict = {};
    const turnaroundTimes = {};
    const burstTimes = {};
    const responseTimes = [];
    const resultTable = [];

    processes.forEach(p => {
        waitTime[p.pid] = 0;
        remainingTime[p.pid] = p.burst;
        arrivalDict[p.pid] = p.arrival;
        burstTimes[p.pid] = p.burst;
    });

    while (processes.length > 0 || queue.length > 0) {
        // 현재 시간에 도착한 프로세스를 큐에 추가
        while (processes.length > 0 && processes[0].arrival <= time) {
            queue.push(processes.shift());
        }

        if (queue.length > 0) {
            const process = queue.shift();
            const execTime = Math.min(delta, remainingTime[process.pid]);
            ganttChart.push({ pid: process.pid, start: time, end: time + execTime });
            time += execTime;
            remainingTime[process.pid] -= execTime;

            // 남은 시간이 있는 경우 큐에 다시 추가
            if (remainingTime[process.pid] > 0) {
                // 현재 시간에 도착한 다른 프로세스를 큐에 추가
                while (processes.length > 0 && processes[0].arrival <= time) {
                    queue.push(processes.shift());
                }
                queue.push(process);
            } else {
                // 프로세스가 완료된 경우
                const turnaroundTime = time - arrivalDict[process.pid];
                const waitingTime = turnaroundTime - burstTimes[process.pid];
                turnaroundTimes[process.pid] = turnaroundTime;
                waitTime[process.pid] = waitingTime;
                responseTimes.push(turnaroundTime);
                resultTable.push({ 
                    pid: process.pid, 
                    arrival: arrivalDict[process.pid], 
                    burst: burstTimes[process.pid],
                    waiting: waitingTime,
                    turnaround: turnaroundTime
                });
            }
        } else {
            time++;
        }
    }

    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    displayGanttChart(ganttChart);
    displayResults(resultTable, avgResponseTime);
}

// 간트 차트를 표시하는 함수
function displayGanttChart(ganttChart) {
    const ganttDiv = document.getElementById('gantt-chart');
    ganttDiv.innerHTML = '';

    const chartContainer = document.createElement('div');
    chartContainer.className = 'gantt-chart-container';

    ganttChart.forEach(block => {
        const ganttBlock = document.createElement('div');
        ganttBlock.className = 'gantt-block';
        ganttBlock.style.gridColumn = `span ${block.end - block.start}`; // 실행 시간에 따라 열 병합
        ganttBlock.innerHTML = `
            <div>${block.pid}</div>
            <div class="time-block">${block.start} - ${block.end}</div>
        `;

        chartContainer.appendChild(ganttBlock);
    });

    ganttDiv.appendChild(chartContainer);
}

// 결과를 표시하는 함수
function displayResults(resultTable, avgResponseTime) {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '';

    const table = document.createElement('table');
    const header = table.createTHead();
    const headerRow = header.insertRow(0);
    const headers = ['Process ID', 'Arrival Time', 'Burst Time', 'Waiting Time', 'Turnaround Time'];
    headers.forEach((text, index) => {
        const cell = headerRow.insertCell(index);
        cell.textContent = text;
    });

    const body = table.createTBody();
    resultTable.sort((a, b) => parseInt(a.pid.slice(1)) - parseInt(b.pid.slice(1)));
    resultTable.forEach(row => {
        const bodyRow = body.insertRow();
        [row.pid, row.arrival, row.burst, row.waiting, row.turnaround].forEach((value, index) => {
            const cell = bodyRow.insertCell(index);
            cell.textContent = value;
        });
    });

    resultsDiv.appendChild(table);

    const avgLabel = document.createElement('div');
    avgLabel.textContent = `Average Response Time: ${avgResponseTime.toFixed(2)}`;
    resultsDiv.appendChild(avgLabel);
}

// 모든 입력값과 결과를 초기화하는 함수
function resetAll() {
    document.getElementById('delta').value = '';
    document.getElementById('process-entries').innerHTML = '';
    document.getElementById('gantt-chart').innerHTML = '';
    document.getElementById('results').innerHTML = '';
    processCount = 0;
}
