import React, { useRef } from 'react';
import { Dialog, DialogTitle, DialogContent, Typography, Box, IconButton, Divider, Button, ListItem, Card, CardMedia, CardContent, Chip, Stack, Paper } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import dayjs from 'dayjs';
import Grid2 from '@mui/material/Grid2';


const ViewEmployeeDialog = ({ open, onClose, user }) => {
  if (!user) return null;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle fontWeight="bold" sx={{  color: '#000000' }}>
        Employee Details
        <IconButton
          color="inherit"
          onClick={onClose}
          aria-label="close"
          sx={{
            position: 'absolute',
            right: 8,
            top: 14,
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent>

        <Stack spacing={2}>
        <Card  sx={{
           display:'flex',boxShadow: (theme) => theme.shadows[4] , 
          borderRadius: 2, }} >
          
          <CardMedia
            component="img"
            sx={{
              width: 120, 
              height: 120, 
              borderRadius: '50%', 
              margin:'10px 20px 10px 20px'
            }}
            image={user.photo}
            alt="Circular Image"
          />
          <Box sx={{ display: 'flex', marginLeft:'30px' ,flexDirection: 'row' ,  }}>

            <CardContent sx={{ flex: '1 0 auto',}}>
              <ListItem>
                <Typography variant='h6' fontWeight={'bold'}>{user.lastName} {user.firstName}</Typography>
              </ListItem>
              <ListItem>
                <Typography variant="body1"><span style={{fontWeight:'bold'}}>Email: </span> {user.email}</Typography>
              </ListItem>
              </CardContent>
          </Box>
        </Card>     
              
       <Card  sx={{
          boxShadow: (theme) => theme.shadows[4],
          borderRadius: 2, }} >
        <Grid2 container spacing={1.6} rowSpacing={1.7}>
            <Grid2 size={5}> 
            </Grid2>
            <Grid2 size={7}>
            </Grid2>
            <Grid2 size={0.2}>
            </Grid2>
            <Grid2 size={4.5}>
              <Typography variant="body1">Employee ID: </Typography>
            </Grid2>
            <Grid2 size={7}>
              {user.userId}
            </Grid2>
            <Grid2 size={0.2}>
            </Grid2>
            <Grid2 size={4.5}>
              <Typography variant="body1">Designation: </Typography>
            </Grid2>
            <Grid2 size={7}>
              {user.designationName}
            </Grid2>
            <Grid2 size={0.2}>
            </Grid2>
            <Grid2 size={4.5}>
              <Typography variant="body1">Department: </Typography>
            </Grid2>
            <Grid2 size={7}>
              {user.departmentName}
            </Grid2>
            <Grid2 size={0.2}>
            </Grid2>
            <Grid2 size={4.5}>
              <Typography variant="body1">Job Location: </Typography>
            </Grid2>
            <Grid2 size={7}>
              {user.cityName}
            </Grid2>
            <Grid2 size={0.2}>
            </Grid2>
            <Grid2 size={4.5}>
              <Typography variant="body1">Date of Birth: </Typography>
            </Grid2>
            <Grid2 size={7}>
              {dayjs(user.dateOfBirth).format("DD-MM-YYYY")}
            </Grid2>
            <Grid2 size={0.2}>
            </Grid2>
            <Grid2 size={4.5}>
              <Typography variant="body1">Blood Group: </Typography>
            </Grid2>
            <Grid2 size={7}>
              {user.bloodGroupName}
            </Grid2>
            <Grid2 size={0.2}>
            </Grid2>
            <Grid2 size={4.5}>
              <Typography variant="body1">Phone Number: </Typography>
            </Grid2>
            <Grid2 size={7}>
              {user.phoneNumber}
            </Grid2>
            <Grid2 size={0.2}>
            </Grid2>
            <Grid2 size={4.5}>
              <Typography variant="body1">Gender: </Typography>
            </Grid2>
            <Grid2 size={7}>
              {user.genderName}
            </Grid2>
            <Grid2 size={0.2}>
            </Grid2>
            <Grid2 size={4.5}>
              <Typography variant="body1">Technical Skills: </Typography>
            </Grid2>
            <Grid2 size={7}>
              {user?.skills?.map((option, index) => {
                return(
                  <Chip variant="outlined" label={option} key={index} sx={{ mr: 1, mb: 1 }} />
                )
              })}
            </Grid2>
            <Grid2 size={5}>
              
            </Grid2>
            <Grid2 size={7}>
              
            </Grid2>
            
          </Grid2>
          </Card>
          </Stack>
      </DialogContent>
    </Dialog>
  );
};

export default ViewEmployeeDialog;
