import { sendPasswordResetEmail } from '../utils/email.js';

console.log('Sending test email...');
sendPasswordResetEmail('classicgeniussocials@gmail.com', '123456')
  .then(res => console.log('Result:', res))
  .catch(err => console.error('Error:', err));
