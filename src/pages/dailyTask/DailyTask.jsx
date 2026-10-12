import React from 'react';
import { ProgressBar, Card, Button, ListGroup, Alert, Badge } from 'react-bootstrap';

const DailyTask = () => {
  const tasks = [
    { id: 1, title: "1 Okuma Alıştırması", completed: true },
    { id: 2, title: "1 Dinleme Alıştırması", completed: false },
    { id: 3, title: "10 Yeni Kelime Öğren", completed: true },
    { id: 4, title: "Mini Test (5 soru)", completed: false },
  ];

  const completedCount = tasks.filter(t => t.completed).length;
  const progress = (completedCount / tasks.length) * 100;

  return (
    <div className="container mt-4">
      <h3 className="mb-4">📆 Günlük Görevlerin</h3>

      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <Card.Title>Görev Listesi</Card.Title>
          <ListGroup>
            {tasks.map(task => (
              <ListGroup.Item key={task.id}>
                <input type="checkbox" checked={task.completed} readOnly className="me-2" />
                {task.title}
                {task.completed && <Badge bg="success" className="ms-2">Tamamlandı</Badge>}
              </ListGroup.Item>
            ))}
          </ListGroup>
        </Card.Body>
      </Card>

      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <Card.Title>İlerlemen</Card.Title>
          <p>{completedCount} / {tasks.length} görev tamamlandı</p>
          <ProgressBar now={progress} label={`${progress}%`} />
        </Card.Body>
      </Card>

      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <Card.Title>🎯 Bugünkü Hedef</Card.Title>
          <p>15 dakikalık çalışma hedefi</p>
          <ProgressBar now={12 / 15 * 100} variant="info" label={`12 dk / 15 dk`} />
        </Card.Body>
      </Card>

      <Alert variant="success" className="text-center">
        💪 Harika gidiyorsun! Bir adım kaldı!
      </Alert>

      <Card className="shadow-sm">
        <Card.Body>
          <Card.Title>🔥 Günlük Puan</Card.Title>
          <p>Toplam: <strong>120 XP</strong> | Serilik Bonusu: <strong>+50</strong></p>
          <Button variant="outline-primary">Rozetleri Gör</Button>
        </Card.Body>
      </Card>
    </div>
  );
};

export default DailyTask;
