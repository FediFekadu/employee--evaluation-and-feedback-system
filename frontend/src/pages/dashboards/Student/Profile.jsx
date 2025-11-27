import React, { useState } from 'react';
import api from '../../../services/api';

function StudentProfile() {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdMessage, setPwdMessage] = useState('');

  return (
    <div>
      <h2>Profile</h2>
      <div className="card" style={{ marginTop: 12 }}>
        <h3>Change Password</h3>
        <div style={{ display: 'grid', gap: 8, maxWidth: 420 }}>
          <input
            className="btn btn-ghost"
            type="password"
            placeholder="Current password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
          />
          <input
            className="btn btn-ghost"
            type="password"
            placeholder="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <button
            className="btn btn-primary"
            disabled={pwdLoading}
            onClick={async () => {
              if (!oldPassword || !newPassword) {
                alert('Enter current and new password');
                return;
              }
              setPwdLoading(true);
              setPwdMessage('');
              try {
                await api.post('/auth/change-password', { old_password: oldPassword, new_password: newPassword });
                setPwdMessage('Password changed successfully');
                setOldPassword('');
                setNewPassword('');
              } catch (e) {
                setPwdMessage('Failed to change password. Check current password.');
              } finally {
                setPwdLoading(false);
              }
            }}
          >
            {pwdLoading ? 'Saving…' : 'Update Password'}
          </button>
          {pwdMessage && <p style={{ color: 'var(--muted)' }}>{pwdMessage}</p>}
        </div>
      </div>
    </div>
  );
}

export default StudentProfile;