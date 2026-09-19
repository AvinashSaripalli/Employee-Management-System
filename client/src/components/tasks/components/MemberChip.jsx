import React from 'react';
import { Box, Avatar, Typography } from '@mui/material';

export default function MemberChip({ photo, name, subtitle }){
  return (
    <Box sx={{ display:'inline-flex', alignItems:'center', gap:1, border:'1px solid #E8EEF9', borderRadius:3, px:1, py:0.5, bgcolor:'#fff' }}>
      <Avatar src={photo||undefined} sx={{ width:24, height:24, fontSize:11 }}>{name?.slice(0,2).toUpperCase()}</Avatar>
      <Box>
        <Typography variant="caption" fontWeight={600} sx={{ lineHeight:1 }}>{name}</Typography>
        <Typography variant="caption" color="text.secondary" sx={{ lineHeight:1, fontSize:10 }}>{subtitle}</Typography>
      </Box>
    </Box>
  );
}
