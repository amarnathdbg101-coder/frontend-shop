import client from './client';

export const staffApi = {
  listStaff: async () => {
    const res = await client.get('/shops/me/staff');
    return res.data?.data || res.data;
  },

  createStaff: async (staffData) => {
    const res = await client.post('/shops/me/staff', staffData);
    return res.data?.data || res.data;
  },

  updateStaff: async (id, staffData) => {
    const res = await client.put(`/shops/me/staff/${id}`, staffData);
    return res.data?.data || res.data;
  },

  deleteStaff: async (id) => {
    const res = await client.delete(`/shops/me/staff/${id}`);
    return res.data;
  },

  loginWithPin: async (pin) => {
    const payload = typeof pin === 'object' ? pin : { pin };
    const res = await client.post('/auth/staff-login', payload);
    return res.data?.data || res.data;
  },

  staffLogin: async ({ shop_id, phone, pin }) => {
    const res = await client.post('/auth/staff-login', {
      shop_id,
      phone,
      pin,
    });
    return res.data?.data || res.data;
  },
};
