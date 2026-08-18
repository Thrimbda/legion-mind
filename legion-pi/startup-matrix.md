# Legion Pi extension startup matrix

Review date: 2026-08-17

Runtime: `@earendil-works/pi-coding-agent@0.84.2`

Probe: credential-free Pi SDK session creation in isolated HOME, XDG, agent, session, and workspace directories. Each row starts in a fresh Node.js process and must load exactly the selected extensions with unique tool names.

| Mask | Extensions | Tool count | Result | Detail |
|---|---|---:|---|---|
| `000` | (core only) | 4 | PASS | No loader errors or duplicate tools |
| `001` | `pi-lens@4.0.1` | 18 | PASS | No loader errors or duplicate tools |
| `010` | `pi-mcp-adapter@2.26.0` | 6 | PASS | No loader errors or duplicate tools |
| `011` | `pi-mcp-adapter@2.26.0`<br>`pi-lens@4.0.1` | 20 | PASS | No loader errors or duplicate tools |
| `100` | `pi-subagents@0.50.0` | 6 | PASS | No loader errors or duplicate tools |
| `101` | `pi-subagents@0.50.0`<br>`pi-lens@4.0.1` | 20 | PASS | No loader errors or duplicate tools |
| `110` | `pi-subagents@0.50.0`<br>`pi-mcp-adapter@2.26.0` | 8 | PASS | No loader errors or duplicate tools |
| `111` | `pi-subagents@0.50.0`<br>`pi-mcp-adapter@2.26.0`<br>`pi-lens@4.0.1` | 22 | PASS | No loader errors or duplicate tools |

Mask order: `pi-subagents`, `pi-mcp-adapter`, `pi-lens`.

## Tool inventory

### 000

read, bash, edit, write

### 001

read, bash, edit, write, lens_diagnostics, lsp_diagnostics, symbol_search, project_report, module_report, read_symbol, read_enclosing, pi_lens_activate_tools, ast_grep_search, ast_grep_replace, ast_grep_outline, ast_grep_dump, lsp_navigation, lens_diagnostic_mark

### 010

read, bash, edit, write, mcpScript, mcp

### 011

read, bash, edit, write, mcpScript, mcp, lens_diagnostics, lsp_diagnostics, symbol_search, project_report, module_report, read_symbol, read_enclosing, pi_lens_activate_tools, ast_grep_search, ast_grep_replace, ast_grep_outline, ast_grep_dump, lsp_navigation, lens_diagnostic_mark

### 100

read, bash, edit, write, subagent, subagent_wait

### 101

read, bash, edit, write, subagent, subagent_wait, lens_diagnostics, lsp_diagnostics, symbol_search, project_report, module_report, read_symbol, read_enclosing, pi_lens_activate_tools, ast_grep_search, ast_grep_replace, ast_grep_outline, ast_grep_dump, lsp_navigation, lens_diagnostic_mark

### 110

read, bash, edit, write, subagent, subagent_wait, mcpScript, mcp

### 111

read, bash, edit, write, subagent, subagent_wait, mcpScript, mcp, lens_diagnostics, lsp_diagnostics, symbol_search, project_report, module_report, read_symbol, read_enclosing, pi_lens_activate_tools, ast_grep_search, ast_grep_replace, ast_grep_outline, ast_grep_dump, lsp_navigation, lens_diagnostic_mark
