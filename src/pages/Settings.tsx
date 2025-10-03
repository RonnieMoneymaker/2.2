import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  Divider,
  Alert,
  Avatar,
  IconButton,
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';

interface ProfileFormData {
  full_name: string;
  email: string;
  username: string;
}

interface PasswordFormData {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export const Settings: React.FC = () => {
  const { user } = useAuth();
  const [editingProfile, setEditingProfile] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { control: profileControl, handleSubmit: handleProfileSubmit, reset: resetProfile } = useForm<ProfileFormData>({
    defaultValues: {
      full_name: user?.full_name || '',
      email: user?.email || '',
      username: user?.username || '',
    }
  });

  const { control: passwordControl, handleSubmit: handlePasswordSubmit, reset: resetPassword, watch } = useForm<PasswordFormData>();

  const onProfileSubmit = async (data: ProfileFormData) => {
    try {
      // Here you would make an API call to update the profile
      console.log('Profile update:', data);
      setMessage({ type: 'success', text: 'Profiel succesvol bijgewerkt' });
      setEditingProfile(false);
    } catch (error) {
      setMessage({ type: 'error', text: 'Fout bij het bijwerken van profiel' });
    }
  };

  const onPasswordSubmit = async (data: PasswordFormData) => {
    if (data.new_password !== data.confirm_password) {
      setMessage({ type: 'error', text: 'Nieuwe wachtwoorden komen niet overeen' });
      return;
    }

    try {
      // Here you would make an API call to change the password
      console.log('Password change:', data);
      setMessage({ type: 'success', text: 'Wachtwoord succesvol gewijzigd' });
      resetPassword();
    } catch (error) {
      setMessage({ type: 'error', text: 'Fout bij het wijzigen van wachtwoord' });
    }
  };

  const handleCancelEdit = () => {
    setEditingProfile(false);
    resetProfile({
      full_name: user?.full_name || '',
      email: user?.email || '',
      username: user?.username || '',
    });
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
        Instellingen
      </Typography>

      {message && (
        <Alert 
          severity={message.type} 
          onClose={() => setMessage(null)}
          sx={{ mb: 3 }}
        >
          {message.text}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Profile Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Profiel Instellingen
                </Typography>
                {!editingProfile && (
                  <IconButton onClick={() => setEditingProfile(true)}>
                    <EditIcon />
                  </IconButton>
                )}
              </Box>

              <Box display="flex" alignItems="center" mb={3}>
                <Avatar sx={{ width: 80, height: 80, mr: 2, fontSize: '2rem' }}>
                  {user?.full_name?.charAt(0).toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="h6">{user?.full_name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {user?.role}
                  </Typography>
                </Box>
              </Box>

              <form onSubmit={handleProfileSubmit(onProfileSubmit)}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Controller
                      name="full_name"
                      control={profileControl}
                      rules={{ required: 'Volledige naam is verplicht' }}
                      render={({ field, fieldState: { error } }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Volledige Naam"
                          disabled={!editingProfile}
                          error={!!error}
                          helperText={error?.message}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Controller
                      name="email"
                      control={profileControl}
                      rules={{ 
                        required: 'Email is verplicht',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Ongeldig email adres'
                        }
                      }}
                      render={({ field, fieldState: { error } }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Email"
                          type="email"
                          disabled={!editingProfile}
                          error={!!error}
                          helperText={error?.message}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Controller
                      name="username"
                      control={profileControl}
                      rules={{ required: 'Gebruikersnaam is verplicht' }}
                      render={({ field, fieldState: { error } }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Gebruikersnaam"
                          disabled={!editingProfile}
                          error={!!error}
                          helperText={error?.message}
                        />
                      )}
                    />
                  </Grid>
                </Grid>

                {editingProfile && (
                  <Box display="flex" gap={2} mt={3}>
                    <Button
                      type="submit"
                      variant="contained"
                      startIcon={<SaveIcon />}
                    >
                      Opslaan
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<CancelIcon />}
                      onClick={handleCancelEdit}
                    >
                      Annuleren
                    </Button>
                  </Box>
                )}
              </form>
            </CardContent>
          </Card>
        </Grid>

        {/* Password Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                Wachtwoord Wijzigen
              </Typography>

              <form onSubmit={handlePasswordSubmit(onPasswordSubmit)}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Controller
                      name="current_password"
                      control={passwordControl}
                      rules={{ required: 'Huidig wachtwoord is verplicht' }}
                      render={({ field, fieldState: { error } }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Huidig Wachtwoord"
                          type="password"
                          error={!!error}
                          helperText={error?.message}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Controller
                      name="new_password"
                      control={passwordControl}
                      rules={{ 
                        required: 'Nieuw wachtwoord is verplicht',
                        minLength: {
                          value: 6,
                          message: 'Wachtwoord moet minimaal 6 karakters zijn'
                        }
                      }}
                      render={({ field, fieldState: { error } }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Nieuw Wachtwoord"
                          type="password"
                          error={!!error}
                          helperText={error?.message}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Controller
                      name="confirm_password"
                      control={passwordControl}
                      rules={{ 
                        required: 'Bevestig het nieuwe wachtwoord',
                        validate: (value) => {
                          const newPassword = watch('new_password');
                          return value === newPassword || 'Wachtwoorden komen niet overeen';
                        }
                      }}
                      render={({ field, fieldState: { error } }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Bevestig Nieuw Wachtwoord"
                          type="password"
                          error={!!error}
                          helperText={error?.message}
                        />
                      )}
                    />
                  </Grid>
                </Grid>

                <Button
                  type="submit"
                  variant="contained"
                  sx={{ mt: 3 }}
                  fullWidth
                >
                  Wachtwoord Wijzigen
                </Button>
              </form>
            </CardContent>
          </Card>
        </Grid>

        {/* System Information */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                Systeem Informatie
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Applicatie Versie
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    VoltMover CRM v2.1.0
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Laatste Login
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {new Date().toLocaleString('nl-NL')}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Account Status
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                    Actief
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Gebruikersrol
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
