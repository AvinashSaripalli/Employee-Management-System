
import React from 'react';
import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Button } from '@mui/material';

const DeleteDialog = ({ open, onClose, onDeleteAll }) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Delete Selected Users</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Are you sure you want to delete all selected users?
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary" variant='contained'>
          Close
        </Button>
        <Button onClick={onDeleteAll} color="error" variant="contained">
          Delete All
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteDialog;
