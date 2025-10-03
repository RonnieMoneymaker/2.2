import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Chip,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm, Controller } from 'react-hook-form';
import axios from 'axios';

interface Task {
  id: number;
  title: string;
  description?: string;
  status: string;
  priority: string;
  due_date?: string;
  completed_at?: string;
  assignee_id: number;
  deal_id?: number;
  created_at: string;
  updated_at: string;
  assignee: {
    full_name: string;
  };
}

interface TaskFormData {
  title: string;
  description: string;
  status: string;
  priority: string;
  due_date: string;
  assignee_id: number;
  deal_id?: number;
}

const taskStatuses = [
  { value: 'todo', label: 'Te Doen', color: '#757575' },
  { value: 'in_progress', label: 'Bezig', color: '#2196f3' },
  { value: 'completed', label: 'Voltooid', color: '#4caf50' },
  { value: 'cancelled', label: 'Geannuleerd', color: '#f44336' },
];

const taskPriorities = [
  { value: 'low', label: 'Laag', color: '#4caf50' },
  { value: 'medium', label: 'Gemiddeld', color: '#ff9800' },
  { value: 'high', label: 'Hoog', color: '#f44336' },
  { value: 'urgent', label: 'Urgent', color: '#9c27b0' },
];

export const Tasks: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const queryClient = useQueryClient();

  const { control, handleSubmit, reset, formState: { errors } } = useForm<TaskFormData>();

  const { data: tasks, isLoading } = useQuery<Task[]>(
    ['tasks', search, statusFilter, priorityFilter, tabValue],
    () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      if (priorityFilter) params.append('priority', priorityFilter);
      if (tabValue === 1) params.append('overdue', 'true');
      
      const endpoint = tabValue === 2 ? '/api/tasks/my' : '/api/tasks';
      return axios.get(`${endpoint}?${params.toString()}`).then((res) => res.data);
    },
    { keepPreviousData: true }
  );

  const { data: users } = useQuery('users-for-tasks', () =>
    axios.get('/api/users').then((res) => res.data)
  );

  const { data: deals } = useQuery('deals-for-tasks', () =>
    axios.get('/api/deals').then((res) => res.data)
  );

  const createMutation = useMutation(
    (data: TaskFormData) => axios.post('/api/tasks', data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('tasks');
        handleClose();
      },
    }
  );

  const updateMutation = useMutation(
    ({ id, data }: { id: number; data: Partial<TaskFormData> }) =>
      axios.put(`/api/tasks/${id}`, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('tasks');
        handleClose();
      },
    }
  );

  const deleteMutation = useMutation(
    (id: number) => axios.delete(`/api/tasks/${id}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('tasks');
      },
    }
  );

  const handleClose = () => {
    setOpen(false);
    setEditingTask(null);
    reset();
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    reset({
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      due_date: task.due_date?.split('T')[0] || '',
      assignee_id: task.assignee_id,
      deal_id: task.deal_id || undefined,
    });
    setOpen(true);
  };

  const onSubmit = (data: TaskFormData) => {
    if (editingTask) {
      updateMutation.mutate({ id: editingTask.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Weet je zeker dat je deze taak wilt verwijderen?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleCompleteTask = (task: Task) => {
    updateMutation.mutate({
      id: task.id,
      data: { status: 'completed' }
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('nl-NL');
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('nl-NL');
  };

  const getStatusInfo = (status: string) => {
    return taskStatuses.find(s => s.value === status) || taskStatuses[0];
  };

  const getPriorityInfo = (priority: string) => {
    return taskPriorities.find(p => p.value === priority) || taskPriorities[0];
  };

  const isOverdue = (task: Task) => {
    if (!task.due_date || task.status === 'completed') return false;
    return new Date(task.due_date) < new Date();
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Taken
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpen(true)}
        >
          Nieuwe Taak
        </Button>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab label="Alle Taken" />
          <Tab label="Verlopen" />
          <Tab label="Mijn Taken" />
        </Tabs>
      </Box>

      {/* Filters */}
      <Box display="flex" gap={2} mb={3} flexWrap="wrap">
        <TextField
          placeholder="Zoek taken..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ maxWidth: 300 }}
        />
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            label="Status"
          >
            <MenuItem value="">Alle statussen</MenuItem>
            {taskStatuses.map((status) => (
              <MenuItem key={status.value} value={status.value}>
                {status.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Prioriteit</InputLabel>
          <Select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            label="Prioriteit"
          >
            <MenuItem value="">Alle prioriteiten</MenuItem>
            {taskPriorities.map((priority) => (
              <MenuItem key={priority.value} value={priority.value}>
                {priority.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Tasks Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Taak</TableCell>
              <TableCell>Toegewezen aan</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Prioriteit</TableCell>
              <TableCell>Vervaldatum</TableCell>
              <TableCell>Aangemaakt</TableCell>
              <TableCell align="right">Acties</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tasks?.map((task) => {
              const statusInfo = getStatusInfo(task.status);
              const priorityInfo = getPriorityInfo(task.priority);
              const overdue = isOverdue(task);
              
              return (
                <TableRow 
                  key={task.id}
                  sx={{ 
                    backgroundColor: overdue ? 'rgba(244, 67, 54, 0.05)' : 'inherit'
                  }}
                >
                  <TableCell>
                    <Typography 
                      variant="subtitle2" 
                      sx={{ 
                        fontWeight: 'bold',
                        textDecoration: task.status === 'completed' ? 'line-through' : 'none'
                      }}
                    >
                      {task.title}
                    </Typography>
                    {task.description && (
                      <Typography variant="body2" color="text.secondary">
                        {task.description}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {task.assignee.full_name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={statusInfo.label}
                      size="small"
                      sx={{
                        backgroundColor: statusInfo.color,
                        color: 'white',
                        fontWeight: 'bold',
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={priorityInfo.label}
                      size="small"
                      variant="outlined"
                      sx={{
                        borderColor: priorityInfo.color,
                        color: priorityInfo.color,
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    {task.due_date ? (
                      <Typography 
                        variant="body2"
                        color={overdue ? 'error' : 'inherit'}
                        sx={{ fontWeight: overdue ? 'bold' : 'normal' }}
                      >
                        {formatDate(task.due_date)}
                        {overdue && ' (Verlopen)'}
                      </Typography>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>{formatDate(task.created_at)}</TableCell>
                  <TableCell align="right">
                    {task.status !== 'completed' && (
                      <IconButton 
                        onClick={() => handleCompleteTask(task)} 
                        size="small"
                        color="success"
                        title="Markeer als voltooid"
                      >
                        <CheckCircleIcon />
                      </IconButton>
                    )}
                    <IconButton onClick={() => handleEdit(task)} size="small">
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDelete(task.id)}
                      size="small"
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
            {(!tasks || tasks.length === 0) && !isLoading && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography color="text.secondary">
                    Geen taken gevonden
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Task Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingTask ? 'Taak Bewerken' : 'Nieuwe Taak'}
        </DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Controller
                  name="title"
                  control={control}
                  rules={{ required: 'Titel is verplicht' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Taak Titel"
                      error={!!errors.title}
                      helperText={errors.title?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Beschrijving"
                      multiline
                      rows={3}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="assignee_id"
                  control={control}
                  rules={{ required: 'Toegewezen aan is verplicht' }}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.assignee_id}>
                      <InputLabel>Toegewezen aan</InputLabel>
                      <Select {...field} label="Toegewezen aan">
                        {users?.map((user: any) => (
                          <MenuItem key={user.id} value={user.id}>
                            {user.full_name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="deal_id"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Gerelateerde Deal (optioneel)</InputLabel>
                      <Select {...field} label="Gerelateerde Deal (optioneel)">
                        <MenuItem value="">Geen deal</MenuItem>
                        {deals?.map((deal: any) => (
                          <MenuItem key={deal.id} value={deal.id}>
                            {deal.title}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="status"
                  control={control}
                  rules={{ required: 'Status is verplicht' }}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.status}>
                      <InputLabel>Status</InputLabel>
                      <Select {...field} label="Status">
                        {taskStatuses.map((status) => (
                          <MenuItem key={status.value} value={status.value}>
                            {status.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="priority"
                  control={control}
                  rules={{ required: 'Prioriteit is verplicht' }}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.priority}>
                      <InputLabel>Prioriteit</InputLabel>
                      <Select {...field} label="Prioriteit">
                        {taskPriorities.map((priority) => (
                          <MenuItem key={priority.value} value={priority.value}>
                            {priority.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="due_date"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Vervaldatum"
                      type="datetime-local"
                      InputLabelProps={{ shrink: true }}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Annuleren</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={createMutation.isLoading || updateMutation.isLoading}
            >
              {editingTask ? 'Bijwerken' : 'Toevoegen'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};
