local M = {}
local win_id = nil
local buf_id = nil

local function get_project_root()
  return vim.fn.stdpath('data') .. '/lazy/spotify-tui'
end

function M.toggle()
  if win_id and vim.api.nvim_win_is_valid(win_id) then
    vim.api.nvim_win_close(win_id, true)
    win_id = nil
    buf_id = nil
    return
  end

  local width = 74
  local height = 21
  local row = math.floor((vim.o.lines - height) / 2)
  local col = math.floor((vim.o.columns - width) / 2)

  buf_id = vim.api.nvim_create_buf(false, true)
  win_id = vim.api.nvim_open_win(buf_id, true, {
    relative = 'editor',
    width = width,
    height = height,
    row = row,
    col = col,
    style = 'minimal',
    border = 'single',
    title = ' Spotify-Tui ',
    title_pos = 'center',
  })

  vim.keymap.set('t', '<Esc>', '<C-\\><C-n>', { buffer = buf_id })

  local root = get_project_root()
  local cmd = 'node ' .. vim.fn.shellescape(root .. '/index.js')

  vim.fn.termopen(cmd, {
    on_exit = function()
      pcall(vim.api.nvim_win_close, win_id, true)
      win_id = nil
      buf_id = nil
    end,
  })

  vim.api.nvim_set_option_value('buftype', 'terminal', { buf = buf_id })
end

M.setup = function(opts)
  opts = opts or {}
  local root = opts.path or get_project_root()

  if opts.path then
    get_project_root = function()
      return opts.path
    end
  end

  vim.api.nvim_create_user_command('SpotifyTui', M.toggle, {})
end

return M
