/* Adicione ao final do arquivo */

/* Notificações */
.notification {
  position: fixed;
  top: 20px;
  right: 20px;
  background: white;
  border-radius: 8px;
  padding: 15px 20px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.2);
  z-index: 9999;
  max-width: 350px;
  transform: translateX(150%);
  transition: transform 0.3s ease;
  border-left: 4px solid #007bff;
}

.notification.show {
  transform: translateX(0);
}

.notification-success {
  border-left-color: #00ff88;
}

.notification-error {
  border-left-color: #ff4757;
}

.notification-warning {
  border-left-color: #ffc107;
}

.notification-info {
  border-left-color: #17a2b8;
}

.notification-content {
  display: flex;
  align-items: center;
  gap: 10px;
}

.notification-close {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  position: absolute;
  top: 5px;
  right: 10px;
  color: #666;
}

/* Loading */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9998;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.loading-overlay.show {
  opacity: 1;
}

.loading-content {
  background: white;
  padding: 30px;
  border-radius: 10px;
  text-align: center;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 5px solid #f3f3f3;
  border-top: 5px solid #00ff88;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 15px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Modais */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9997;
  padding: 20px;
}

.modal {
  background: white;
  border-radius: 10px;
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-lg {
  max-width: 700px;
}

.modal-header {
  padding: 20px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
}

.modal-body {
  padding: 20px;
}

.modal-footer {
  padding: 20px;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* Cards de música */
.music-card {
  background: white;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 3px 10px rgba(0,0,0,0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.music-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0,0,0,0.15);
}

.music-cover {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.music-badges {
  position: absolute;
  top: 10px;
  left: 10px;
  display: flex;
  gap: 5px;
}

.badge {
  padding: 5px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: bold;
}

.badge.genre {
  background: #00ff88;
  color: black;
}

.badge.price {
  background: #007bff;
  color: white;
}

.music-card-body {
  padding: 15px;
}

.music-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin: 15px 0;
}

.stat {
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 12px;
  color: #666;
}

.stat-value {
  display: block;
  font-weight: bold;
  font-size: 14px;
}

.progress-bar {
  height: 5px;
  background: #eee;
  border-radius: 3px;
  margin: 10px 0;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #00ff88;
  transition: width 0.3s ease;
}

.music-actions {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

/* Estados vazios */
.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #666;
}

.empty-state i {
  font-size: 48px;
  color: #ccc;
  margin-bottom: 15px;
}

/* Botões */
.btn {
  padding: 10px 20px;
  border-radius: 5px;
  border: none;
  cursor: pointer;
  font-weight: bold;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
}

.btn-primary {
  background: #00ff88;
  color: black;
}

.btn-primary:hover {
  background: #00cc6a;
  transform: translateY(-2px);
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-outline {
  background: transparent;
  border: 2px solid #00ff88;
  color: #00ff88;
}

.btn-outline:hover {
  background: #00ff88;
  color: black;
}

.btn-disabled {
  background: #ccc;
  color: #666;
  cursor: not-allowed;
}

/* Forms */
.form-control {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 14px;
}

.form-group {
  margin-bottom: 15px;
}

.form-text {
  display: block;
  font-size: 12px;
  color: #666;
  margin-top: 5px;
}

/* Responsividade */
@media (max-width: 768px) {
  .music-stats {
    grid-template-columns: 1fr;
  }
  
  .music-actions {
    flex-direction: column;
  }
  
  .modal {
    max-width: 95%;
  }
}
