// src/components/CreateUser.jsx
import { useState } from 'react';
import { userService } from '../services/userServices';

const CreateUser = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    // add other fields from your UserCreate schema
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const newUser = await userService.CreateUser(formData);
      setMessage('User created successfully!');
      console.log('Created user:', newUser);
      
      // Reset form or redirect
      setFormData({ username: '', email: '' });
    } catch (error) {
      setMessage(error.response?.data?.detail || 'Failed to create user');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Username"
        value={formData.username}
        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
      />
      <input
        type="email"
        placeholder="Email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create User'}
      </button>
      {message && <p>{message}</p>}
    </form>
  );
};

export default CreateUser;
