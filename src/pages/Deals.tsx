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
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm, Controller } from 'react-hook-form';
import axios from 'axios';

interface Deal {
  id: number;
  title: string;
  description?: string;
  value: number;
  stage: string;
  probability: number;
  expected_close_date?: string;
  actual_close_date?: string;
  contact_id: number;
  owner_id: number;
  created_at: string;
  updated_at: string;
  contact: {
    first_name: string;
    last_name: string;
    company?: string;
  };
  owner: {
    full_name: string;
  };
}

interface DealFormData {
  title: string;
  description: string;
  value: number;
  stage: string;
  probability: number;
  expected_close_date: string;
  contact_id: number;
}

const dealStages = [
  { value: 'lead', label: 'Lead', color: '#f44336' },
  { value: 'qualified', label: 'Gekwalificeerd', color: '#ff9800' },
  { value: 'proposal', label: 'Voorstel', color: '#2196f3' },
  { value: 'negotiation', label: 'Onderhandeling', color: '#9c27b0' },
  { value: 'closed_won', label: 'Gewonnen', color: '#4caf50' },
  { value: 'closed_lost', label: 'Verloren', color: '#757575' },
];

export const Deals: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const queryClient = useQueryClient();

  const { control, handleSubmit, reset, formState: { errors } } = useForm<DealFormData>();

  const { data: deals, isLoading } = useQuery<Deal[]>(
    ['deals', search, stageFilter],
    () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (stageFilter) params.append('stage', stageFilter);
      return axios.get(`/api/deals?${params.toString()}`).then((res) => res.data);
    },
    { keepPreviousData: true }
  );

  const { data: contacts } = useQuery('contacts-for-deals', () =>
    axios.get('/api/contacts').then((res) => res.data)
  );

  const createMutation = useMutation(
    (data: DealFormData) => axios.post('/api/deals', { ...data, owner_id: 1 }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('deals');
        handleClose();
      },
    }
  );

  const updateMutation = useMutation(
    ({ id, data }: { id: number; data: Partial<DealFormData> }) =>
      axios.put(`/api/deals/${id}`, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('deals');
        handleClose();
      },
    }
  );

  const deleteMutation = useMutation(
    (id: number) => axios.delete(`/api/deals/${id}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('deals');
      },
    }
  );

  const handleClose = () => {
    setOpen(false);
    setEditingDeal(null);
    reset();
  };

  const handleEdit = (deal: Deal) => {
    setEditingDeal(deal);
    reset({
      title: deal.title,
      description: deal.description || '',
      value: deal.value,
      stage: deal.stage,
      probability: deal.probability,
      expected_close_date: deal.expected_close_date?.split('T')[0] || '',
      contact_id: deal.contact_id,
    });
    setOpen(true);
  };

  const onSubmit = (data: DealFormData) => {
    if (editingDeal) {
      updateMutation.mutate({ id: editingDeal.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Weet je zeker dat je deze deal wilt verwijderen?')) {
      deleteMutation.mutate(id);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('nl-NL');
  };

  const getStageInfo = (stage: string) => {
    return dealStages.find(s => s.value === stage) || dealStages[0];
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Deals
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpen(true)}
        >
          Nieuwe Deal
        </Button>
      </Box>

      {/* Filters */}
      <Box display="flex" gap={2} mb={3}>
        <TextField
          placeholder="Zoek deals..."
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
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Filter op status</InputLabel>
          <Select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            label="Filter op status"
          >
            <MenuItem value="">Alle statussen</MenuItem>
            {dealStages.map((stage) => (
              <MenuItem key={stage.value} value={stage.value}>
                {stage.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Deals Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Deal</TableCell>
              <TableCell>Contact</TableCell>
              <TableCell>Waarde</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Kans</TableCell>
              <TableCell>Verwachte Sluiting</TableCell>
              <TableCell align="right">Acties</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {deals?.map((deal) => {
              const stageInfo = getStageInfo(deal.stage);
              return (
                <TableRow key={deal.id}>
                  <TableCell>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                      {deal.title}
                    </Typography>
                    {deal.description && (
                      <Typography variant="body2" color="text.secondary">
                        {deal.description}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {deal.contact.first_name} {deal.contact.last_name}
                    </Typography>
                    {deal.contact.company && (
                      <Typography variant="caption" color="text.secondary">
                        {deal.contact.company}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                      {formatCurrency(deal.value)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={stageInfo.label}
                      size="small"
                      sx={{
                        backgroundColor: stageInfo.color,
                        color: 'white',
                        fontWeight: 'bold',
                      }}
                    />
                  </TableCell>
                  <TableCell>{deal.probability}%</TableCell>
                  <TableCell>
                    {deal.expected_close_date
                      ? formatDate(deal.expected_close_date)
                      : '-'}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton onClick={() => handleEdit(deal)} size="small">
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDelete(deal.id)}
                      size="small"
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
            {(!deals || deals.length === 0) && !isLoading && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography color="text.secondary">
                    Geen deals gevonden
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Deal Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingDeal ? 'Deal Bewerken' : 'Nieuwe Deal'}
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
                      label="Deal Titel"
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
                  name="contact_id"
                  control={control}
                  rules={{ required: 'Contact is verplicht' }}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.contact_id}>
                      <InputLabel>Contact</InputLabel>
                      <Select {...field} label="Contact">
                        {contacts?.map((contact: any) => (
                          <MenuItem key={contact.id} value={contact.id}>
                            {contact.first_name} {contact.last_name}
                            {contact.company && ` (${contact.company})`}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="value"
                  control={control}
                  rules={{ required: 'Waarde is verplicht', min: 0 }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Deal Waarde (€)"
                      type="number"
                      error={!!errors.value}
                      helperText={errors.value?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="stage"
                  control={control}
                  rules={{ required: 'Status is verplicht' }}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.stage}>
                      <InputLabel>Status</InputLabel>
                      <Select {...field} label="Status">
                        {dealStages.map((stage) => (
                          <MenuItem key={stage.value} value={stage.value}>
                            {stage.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="probability"
                  control={control}
                  rules={{ required: 'Kans is verplicht', min: 0, max: 100 }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Kans (%)"
                      type="number"
                      inputProps={{ min: 0, max: 100 }}
                      error={!!errors.probability}
                      helperText={errors.probability?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="expected_close_date"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Verwachte Sluitingsdatum"
                      type="date"
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
              {editingDeal ? 'Bijwerken' : 'Toevoegen'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};
