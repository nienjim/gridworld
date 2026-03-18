from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/value_iteration', methods=['POST'])
def run_value_iteration():
    data = request.json
    grid_size = data.get('grid_size', 5)
    start = tuple(data.get('start', [0, 0]))
    end = tuple(data.get('end', [4, 4]))
    blocks = [tuple(b) for b in data.get('blocks', [[1, 1], [2, 2], [3, 3]])]
    
    # Grid initialization
    # States are (r, c)
    states = [(r, c) for r in range(grid_size) for c in range(grid_size)]
    V = {s: 0.0 for s in states}
    policy = {s: None for s in states}
    
    actions = {
        'UP': (-1, 0),
        'DOWN': (1, 0),
        'LEFT': (0, -1),
        'RIGHT': (0, 1)
    }
    
    gamma = 0.9 # Discount factor
    theta = 1e-4 # Convergence threshold
    
    def get_reward(s):
        if s == end:
            return 10.0
        if s in blocks:
            return -100.0 # High penalty for obstacles
        return -0.1 # Small penalty to encourage shortest path

    def is_valid(s):
        r, c = s
        return 0 <= r < grid_size and 0 <= c < grid_size and s not in blocks

    # Value Iteration Loop
    while True:
        delta = 0
        for s in states:
            if s == end or s in blocks:
                continue
                
            v = V[s]
            max_val = float('-inf')
            
            for action_name, (dr, dc) in actions.items():
                next_r, next_c = s[0] + dr, s[1] + dc
                next_s = (next_r, next_c)
                
                if is_valid(next_s):
                    val = get_reward(next_s) + gamma * V[next_s]
                else:
                    # Bumping into wall/obstacle stays in same state
                    val = -1.0 + gamma * V[s]
                    
                if val > max_val:
                    max_val = val
                    
            V[s] = max_val
            delta = max(delta, abs(v - V[s]))
            
        if delta < theta:
            break
            
    # Policy Extraction
    for s in states:
        if s == end or s in blocks:
            continue
            
        max_val = float('-inf')
        best_action = None
        
        for action_name, (dr, dc) in actions.items():
            next_r, next_c = s[0] + dr, s[1] + dc
            next_s = (next_r, next_c)
            
            if is_valid(next_s):
                val = get_reward(next_s) + gamma * V[next_s]
            else:
                val = -1.0 + gamma * V[s]
                
            if val > max_val:
                max_val = val
                best_action = action_name
                
        policy[s] = best_action
        
    # Format output for JSON
    v_out = []
    p_out = []
    for r in range(grid_size):
        v_row = []
        p_row = []
        for c in range(grid_size):
            s = (r, c)
            v_row.append(round(V[s], 2))
            p_row.append(policy[s])
        v_out.append(v_row)
        p_out.append(p_row)
        
    return jsonify({
        'values': v_out,
        'policy': p_out
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)
