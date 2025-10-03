import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Chip,
} from '@mui/material';
import {
  People as PeopleIcon,
  Business as BusinessIcon,
  Task as TaskIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { useQuery } from 'react-query';
import axios from 'axios';

interface DashboardStats {
  total_contacts: number;
  total_deals: number;
  total_deal_value: number;
  deals_won_this_month: number;
  deals_lost_this_month: number;
  tasks_pending: number;
  tasks_overdue: number;
}

interface DealsByStage {
  stage: string;
  count: number;
  value: number;
}

interface RecentActivity {
  id: number;
  type: string;
  subject: string;
  created_at: string;
  user_name: string;
}

const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}> = ({ title, value, icon, color }) => (
  <Card>
    <CardContent>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box>
          <Typography color="textSecondary" gutterBottom variant="body2">
            {title}
          </Typography>
          <Typography variant="h4" component="h2" sx={{ fontWeight: 'bold' }}>
            {value}
          </Typography>
        </Box>
        <Box
          sx={{
            backgroundColor: color,
            borderRadius: '50%',
            p: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {React.cloneElement(icon as React.ReactElement, {
            sx: { color: 'white', fontSize: 24 },
          })}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

export const Dashboard: React.FC = () => {
  const { data: stats } = useQuery<DashboardStats>('dashboard-stats', () =>
    axios.get('/api/dashboard/stats').then((res) => res.data)
  );

  const { data: dealsByStage } = useQuery<DealsByStage[]>('deals-by-stage', () =>
    axios.get('/api/dashboard/deals-by-stage').then((res) => res.data)
  );

  const { data: recentActivities } = useQuery<RecentActivity[]>('recent-activities', () =>
    axios.get('/api/dashboard/recent-activities').then((res) => res.data)
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStageColor = (stage: string) => {
    const colors: { [key: string]: string } = {
      lead: '#f44336',
      qualified: '#ff9800',
      proposal: '#2196f3',
      negotiation: '#9c27b0',
      closed_won: '#4caf50',
      closed_lost: '#757575',
    };
    return colors[stage] || '#757575';
  };

  const getStageLabel = (stage: string) => {
    const labels: { [key: string]: string } = {
      lead: 'Lead',
      qualified: 'Gekwalificeerd',
      proposal: 'Voorstel',
      negotiation: 'Onderhandeling',
      closed_won: 'Gewonnen',
      closed_lost: 'Verloren',
    };
    return labels[stage] || stage;
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
        Dashboard
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Totaal Contacten"
            value={stats?.total_contacts || 0}
            icon={<PeopleIcon />}
            color="#2196f3"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Actieve Deals"
            value={stats?.total_deals || 0}
            icon={<BusinessIcon />}
            color="#4caf50"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Deal Waarde"
            value={formatCurrency(stats?.total_deal_value || 0)}
            icon={<TrendingUpIcon />}
            color="#ff9800"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Openstaande Taken"
            value={stats?.tasks_pending || 0}
            icon={<TaskIcon />}
            color="#9c27b0"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Deal Pipeline */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              Deal Pipeline
            </Typography>
            <List>
              {dealsByStage?.map((stage) => (
                <ListItem key={stage.stage} sx={{ px: 0 }}>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Chip
                          label={getStageLabel(stage.stage)}
                          size="small"
                          sx={{
                            backgroundColor: getStageColor(stage.stage),
                            color: 'white',
                            fontWeight: 'bold',
                          }}
                        />
                        <Typography variant="body2" color="text.secondary">
                          {stage.count} deals
                        </Typography>
                      </Box>
                    }
                    secondary={formatCurrency(stage.value)}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Recent Activities */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              Recente Activiteiten
            </Typography>
            <List>
              {recentActivities?.map((activity) => (
                <ListItem key={`${activity.type}-${activity.id}`} sx={{ px: 0 }}>
                  <ListItemText
                    primary={activity.subject}
                    secondary={
                      <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                        <Chip
                          label={activity.type === 'deal' ? 'Deal' : 'Taak'}
                          size="small"
                          variant="outlined"
                        />
                        <Typography variant="caption" color="text.secondary">
                          {activity.user_name} • {formatDate(activity.created_at)}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
              {(!recentActivities || recentActivities.length === 0) && (
                <ListItem sx={{ px: 0 }}>
                  <ListItemText
                    primary="Geen recente activiteiten"
                    secondary="Start met het toevoegen van contacten en deals"
                  />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};
