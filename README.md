# Value Iteration Visualizer 🤖

A lightweight, interactive web application built with Flask and Vanilla HTML/CSS/JS to visualize the **Value Iteration** algorithm, a fundamental concept in Reinforcement Learning (RL). 

This project allows you to construct a custom 5x5 grid world, define start/goal states and obstacles, and watch the Bellman equation solve for the Optimal Value function $V(s)$ and Optimal Policy $\pi(s)$.

## Features 🚀
*   **Interactive Grid:** Click cells to define the Start point (S), Goal point (G), and Obstacles (Blocks).
*   **Real-time Calculation:** Runs the Value Iteration algorithm on the backend and streams results to the frontend.
*   **Dual View Modes:** 
    *   **Show Values $V(s)$:** View the computed future expected reward of every state.
    *   **Show Policy $\pi(s)$:** View the optimal directional arrows pointing towards the shortest obstacle-free path.
*   **Safe Selection Mode:** The default "Select" tool lets you explore results without accidentally interacting with and resetting the grid.

## Quick Start 🚦

### Prerequisites
*   Python 3.x
*   Flask

### Installation
1.  Clone this repository.
2.  Install dependencies:
    ```bash
    pip install flask
    ```
3.  Run the application:
    ```bash
    python app.py
    ```
4.  Open your browser and navigate to `http://127.0.0.1:5000`.

---

## 💬 Q&A / Developer Insights (對話紀錄精華)

以下內容整理自開發過程中的討論紀錄，有助於深入理解背後的強化學習理論與程式實作細節。

### Q1: 網格旁的「Select」工具作用是什麼？
**A:** 左側工具列的「Select (滑鼠游標圖示)」是一個**安全檢視模式**。
當跑完 Value Iteration 並顯示結果後，如果不小心點到網格，會被系統視為「變更了環境狀態」而重置所有計算結果。啟用 Select 模式後點擊網格將不會觸發任何行為，讓使用者可以安心地觀察數值 ($V(s)$) 與政策箭頭 ($\pi(s)$)，不用擔心誤觸破壞畫面。

### Q2: 點擊「Run Value Iteration」背後具體執行了什麼？
**A:** 這是觸發後端數學計算引擎的按鈕。它執行的是典型的**價值迭代演算法 (Value Iteration)**：
1. **定義獎懲規則 (Reward Function):** 踩到終點得 +10 分，撞到障礙得 -100 分，每走一步空白格扣 -0.1 分（這微小的懲罰是為了逼迫演算法尋找「最短路徑」）。
2. **貝爾曼方程式 (Bellman Equation) 迭代:** 系統先假設所有格子價值為 0。接著針對每個格子，模擬「往上下左右走一步的收益」，並不斷更新自身的身價。這個水波般擴散的評估過程會反覆進行，直到所有格子的數值收斂穩定為止。這一步算出的就是顯示在畫面上的 **Values $V(s)$**。
3. **提取最佳政策 (Policy Extraction):** 分數確定後，對每一個格子來說，只要觀察「周圍哪個相鄰格子的分數最高」，箭頭就指向那邊。這就是顯示在畫面上的 **Policy $\pi(s)$** 導航指示。

### Q3: 為什麼計算出來後，終點 (Goal) 自身的數字是「0」？
**A:** 這牽涉到強化學習中「回合 (Episode)」結束的定義。
在公式中，所有的格子 (State) 會透過評估「走到下一步的好處＋下一步本身的價值」來更新自己。但**終點是遊戲結束的狀態 (Terminal State)**，一旦踩上去就過關了，沒有所謂的「下一步」，因此不需要（也不應該）去評估它未來的收益。
在程式中，我們將所有格子初始值設為 0，接著在迴圈計算時「刻意跳過更新終點格子」。這使得終點永遠維持 0 分，但它周圍的格子因為能「一步踏入終點拿到 +10 分獎勵」，所以會被計算出將近 10 分的高價值。在數學邏輯上，維持終點未來收益為 0 才是正確的。

### Q4: 如果強制把終點的分數設為 +10，會發生什麼事？
**A:** 如果為了「視覺直觀」而強制給予終點自身 10 分的 V 值，會引發數學上的**雙重計算 (Double Counting)** 錯誤。
這會導致終點旁邊的格子在計算時，把「走進終點的過關獎勵 (+10)」和「終點本身的價值 (10 × 0.9 折扣率)」相加，變成 19 分！下一格又會變成約 17 分。
整個地圖的數字區間會像滾雪球一樣被盲目放大，雖然相對大小（箭頭方向）可能還是對的，但絕對數值已經失去了真實的統計意義。因此本作維持最純粹的數學定義，初始值歸零。
