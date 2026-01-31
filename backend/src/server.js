import express from 'express';

const app = express();

app.get('/', (req, res) => {
  res.sendFile('index.html', { root: '.' });
});

app.get('/api/CreateNew', (req, res) => {
    const mssg = 'Create New';
    res.sendFile('../frontend/src/pages/CreateNew/index.html', { root: '.' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT} at http://localhost:${PORT}`);
});