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
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm, Controller } from 'react-hook-form';
import axios from 'axios';

interface Contact {
  id: number;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  company?: string;
  position?: string;
  address?: string;
  notes?: string;
  tags?: string;
  owner_id: number;
  created_at: string;
  updated_at: string;
}

interface ContactFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  company: string;
  position: string;
  address: string;
  notes: string;
  tags: string;
}

export const Contacts: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const { control, handleSubmit, reset, formState: { errors } } = useForm<ContactFormData>();

  const { data: contacts, isLoading } = useQuery<Contact[]>(
    ['contacts', search],
    () => axios.get(`/api/contacts?search=${search}`).then((res) => res.data),
    { keepPreviousData: true }
  );

  const createMutation = useMutation(
    (data: ContactFormData) => axios.post('/api/contacts', { ...data, owner_id: 1 }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('contacts');
        handleClose();
      },
    }
  );

  const updateMutation = useMutation(
    ({ id, data }: { id: number; data: Partial<ContactFormData> }) =>
      axios.put(`/api/contacts/${id}`, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('contacts');
        handleClose();
      },
    }
  );

  const deleteMutation = useMutation(
    (id: number) => axios.delete(`/api/contacts/${id}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('contacts');
      },
    }
  );

  const handleClose = () => {
    setOpen(false);
    setEditingContact(null);
    reset();
  };

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact);
    reset({
      first_name: contact.first_name,
      last_name: contact.last_name,
      email: contact.email || '',
      phone: contact.phone || '',
      company: contact.company || '',
      position: contact.position || '',
      address: contact.address || '',
      notes: contact.notes || '',
      tags: contact.tags || '',
    });
    setOpen(true);
  };

  const onSubmit = (data: ContactFormData) => {
    if (editingContact) {
      updateMutation.mutate({ id: editingContact.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Weet je zeker dat je dit contact wilt verwijderen?')) {
      deleteMutation.mutate(id);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('nl-NL');
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Contacten
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpen(true)}
        >
          Nieuw Contact
        </Button>
      </Box>

      {/* Search */}
      <Box mb={3}>
        <TextField
          fullWidth
          placeholder="Zoek contacten..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ maxWidth: 400 }}
        />
      </Box>

      {/* Contacts Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Naam</TableCell>
              <TableCell>Contact Info</TableCell>
              <TableCell>Bedrijf</TableCell>
              <TableCell>Tags</TableCell>
              <TableCell>Aangemaakt</TableCell>
              <TableCell align="right">Acties</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {contacts?.map((contact) => (
              <TableRow key={contact.id}>
                <TableCell>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                    {contact.first_name} {contact.last_name}
                  </Typography>
                  {contact.position && (
                    <Typography variant="body2" color="text.secondary">
                      {contact.position}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Box display="flex" flexDirection="column" gap={0.5}>
                    {contact.email && (
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <EmailIcon fontSize="small" color="action" />
                        <Typography variant="body2">{contact.email}</Typography>
                      </Box>
                    )}
                    {contact.phone && (
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <PhoneIcon fontSize="small" color="action" />
                        <Typography variant="body2">{contact.phone}</Typography>
                      </Box>
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  {contact.company && (
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <BusinessIcon fontSize="small" color="action" />
                      <Typography variant="body2">{contact.company}</Typography>
                    </Box>
                  )}
                </TableCell>
                <TableCell>
                  {contact.tags && (
                    <Box display="flex" gap={0.5} flexWrap="wrap">
                      {contact.tags.split(',').map((tag, index) => (
                        <Chip key={index} label={tag.trim()} size="small" />
                      ))}
                    </Box>
                  )}
                </TableCell>
                <TableCell>{formatDate(contact.created_at)}</TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => handleEdit(contact)} size="small">
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => handleDelete(contact.id)}
                    size="small"
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {(!contacts || contacts.length === 0) && !isLoading && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography color="text.secondary">
                    Geen contacten gevonden
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Contact Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingContact ? 'Contact Bewerken' : 'Nieuw Contact'}
        </DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="first_name"
                  control={control}
                  rules={{ required: 'Voornaam is verplicht' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Voornaam"
                      error={!!errors.first_name}
                      helperText={errors.first_name?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="last_name"
                  control={control}
                  rules={{ required: 'Achternaam is verplicht' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Achternaam"
                      error={!!errors.last_name}
                      helperText={errors.last_name?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Email"
                      type="email"
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="phone"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Telefoon"
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="company"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Bedrijf"
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="position"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Functie"
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="address"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Adres"
                      multiline
                      rows={2}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="tags"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Tags (gescheiden door komma's)"
                      placeholder="klant, prospect, belangrijk"
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="notes"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Notities"
                      multiline
                      rows={3}
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
              {editingContact ? 'Bijwerken' : 'Toevoegen'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};
