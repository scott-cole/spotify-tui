local M = {}
local win_id = nil
local buf_id = nil
local job_id = nil

local function get_project_root()
  return vim.fn.stdpath('data') .. '/lazy/spotify-tui'
end

local function close()
  if job_id and pcall(vim.fn.jobpid, job_id) then
    pcall(vim.fn.chanclose, job_id)
  end
  if win_id and vim.api.nvim_win_is_valid(win_id) then
    vim.api.nvim_win_close(win_id, true)
  end
  if buf_id and vim.api.nvim_buf_is_valid(buf_id) then
    pcall(vim.api.nvim_buf_delete, buf_id, { force = true })
  end
  win_id = nil
  buf_id = nil
  job_id = nil
end

function M.toggle()
  if win_id and vim.api.nvim_win_is_valid(win_id) then
    close()
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

  local root = get_project_root()
  local cmd = 'node ' .. vim.fn.shellescape(root .. '/index.js')

  job_id = vim.fn.termopen(cmd, {
    on_exit = function()
      close()
    end,
  })

  vim.api.nvim_set_option_value('buftype', 'terminal', { buf = buf_id })

  vim.keymap.set('n', 'p', function() vim.api.nvim_chan_send(job_id, 'p') end, { buffer = buf_id, nowait = true })
  vim.keymap.set('n', 'n', function() vim.api.nvim_chan_send(job_id, 'n') end, { buffer = buf_id, nowait = true })
  vim.keymap.set('n', 'b', function() vim.api.nvim_chan_send(job_id, 'b') end, { buffer = buf_id, nowait = true })
  vim.keymap.set('n', 'q', function() vim.api.nvim_chan_send(job_id, 'q') end, { buffer = buf_id, nowait = true })
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

  vim.api.nvim_create_autocmd('TermClose', {
    group = vim.api.nvim_create_augroup('SpotifyTui', { clear = true }),
    callback = function()
      close()
    end,
  })
end

return M
