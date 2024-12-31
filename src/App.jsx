import React, { useState, useEffect } from 'react';
    import { v4 as uuidv4 } from 'uuid';
    import { FaEdit, FaTrash, FaPlay, FaStop } from 'react-icons/fa';

    function App() {
      const [projects, setProjects] = useState(() => {
        const savedProjects = localStorage.getItem('projects');
        return savedProjects ? JSON.parse(savedProjects) : [];
      });
      const [tasks, setTasks] = useState(() => {
        const savedTasks = localStorage.getItem('tasks');
        return savedTasks ? JSON.parse(savedTasks) : [];
      });
      const [newProjectName, setNewProjectName] = useState('');
      const [newTaskName, setNewTaskName] = useState('');
      const [selectedProject, setSelectedProject] = useState(null);
      const [activeTask, setActiveTask] = useState(null);
      const [startTime, setStartTime] = useState(null);
      const [currentTime, setCurrentTime] = useState(null);

      useEffect(() => {
        localStorage.setItem('projects', JSON.stringify(projects));
      }, [projects]);

      useEffect(() => {
        localStorage.setItem('tasks', JSON.stringify(tasks));
      }, [tasks]);

      useEffect(() => {
        let interval;
        if (activeTask && startTime) {
          interval = setInterval(() => {
            setCurrentTime(Date.now());
          }, 1000);
        } else {
          clearInterval(interval);
        }
        return () => clearInterval(interval);
      }, [activeTask, startTime]);

      const addProject = () => {
        if (newProjectName.trim()) {
          const newProject = { id: uuidv4(), name: newProjectName };
          setProjects([...projects, newProject]);
          setNewProjectName('');
        }
      };

      const editProject = (id) => {
        const newName = prompt('Enter new project name:');
        if (newName) {
          setProjects(projects.map(project =>
            project.id === id ? { ...project, name: newName } : project
          ));
        }
      };

      const deleteProject = (id) => {
        setProjects(projects.filter(project => project.id !== id));
        setTasks(tasks.filter(task => task.projectId !== id));
      };

      const addTask = () => {
        if (newTaskName.trim() && selectedProject) {
          const newTask = {
            id: uuidv4(),
            name: newTaskName,
            projectId: selectedProject,
            timeLogs: [],
          };
          setTasks([...tasks, newTask]);
          setNewTaskName('');
        }
      };

      const editTask = (id) => {
        const newName = prompt('Enter new task name:');
        if (newName) {
          setTasks(tasks.map(task =>
            task.id === id ? { ...task, name: newName } : task
          ));
        }
      };

      const deleteTask = (id) => {
        setTasks(tasks.filter(task => task.id !== id));
      };

      const startTimer = (taskId) => {
        setActiveTask(taskId);
        setStartTime(Date.now());
      };

      const stopTimer = (taskId) => {
        if (activeTask === taskId) {
          const endTime = Date.now();
          const durationInSeconds = Math.round((endTime - startTime) / 1000);
          let roundedDuration;

          if (durationInSeconds > 0 && durationInSeconds <= 29 * 60 + 59) {
              roundedDuration = 30 * 60;
          } else {
              roundedDuration = Math.ceil(durationInSeconds / (30 * 60)) * 30 * 60;
          }

          const logEntry = { start: startTime, end: endTime, duration: roundedDuration };

          setTasks(tasks.map(task =>
            task.id === taskId ? { ...task, timeLogs: [...task.timeLogs, logEntry] } : task
          ));
          setActiveTask(null);
          setStartTime(null);
          setCurrentTime(null);
        }
      };

      const formatTime = (time) => {
        if (!time) return '00:00:00';
        const totalSeconds = Math.floor(time / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      };

      const formatDuration = (duration) => {
        const hours = Math.floor(duration / 3600);
        const minutes = Math.floor((duration % 3600) / 60);
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
      };

      const parseTime = (timeString) => {
          const [hours, minutes, seconds] = timeString.split(':').map(Number);
          return hours * 60 + minutes + seconds / 60;
      };

      const editTimeLog = (taskId, logIndex) => {
          const newDuration = prompt('Enter new duration in HH:MM:SS format:');
          if (newDuration) {
              const durationInMinutes = parseTime(newDuration);
              let roundedDuration;
              if (durationInMinutes > 0 && durationInMinutes <= 29) {
                  roundedDuration = 30;
              } else {
                  roundedDuration = Math.ceil(durationInMinutes / 30) * 30;
              }
              setTasks(tasks.map(task => {
                  if (task.id === taskId) {
                      const updatedTimeLogs = task.timeLogs.map((log, index) =>
                          index === logIndex ? { ...log, duration: roundedDuration * 60 } : log
                      );
                      return { ...task, timeLogs: updatedTimeLogs };
                  }
                  return task;
              }));
          }
      };

      const deleteTimeLog = (taskId, logIndex) => {
        setTasks(tasks.map(task => {
          if (task.id === taskId) {
            const updatedTimeLogs = task.timeLogs.filter((_, index) => index !== logIndex);
            return { ...task, timeLogs: updatedTimeLogs };
          }
          return task;
        }));
      };

      const calculateTotalTime = (projectId) => {
        let totalSeconds = 0;
        tasks.filter(task => task.projectId === projectId).forEach(task => {
          task.timeLogs.forEach(log => {
            totalSeconds += log.duration;
          });
        });
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
      };

      const generateInvoice = (projectId) => {
        const projectName = projects.find(project => project.id === projectId)?.name || 'Unknown Project';
        const totalTime = calculateTotalTime(projectId);
        const invoiceContent = `Invoice for ${projectName}\nTotal Time: ${totalTime}`;
        const blob = new Blob([invoiceContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `invoice-${projectName.replace(/\s/g, '-')}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      };

      return (
        <div className="container">
          <h1>ChronoTrakr</h1>

          <h2>Projects</h2>
          <ul className="project-list">
            {projects.map(project => (
              <li key={project.id} className="project-item">
                <h3>{project.name}</h3>
                <div className="actions">
                  <button onClick={() => editProject(project.id)}><FaEdit /></button>
                  <button onClick={() => deleteProject(project.id)}><FaTrash /></button>
                </div>
              </li>
            ))}
          </ul>
          <div className="add-form">
            <input
              type="text"
              placeholder="New project name"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
            />
            <button onClick={addProject}>Add Project</button>
          </div>

          <h2>Tasks</h2>
          <select onChange={(e) => setSelectedProject(e.target.value)}>
            <option value="">Select a project</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>{project.name}</option>
            ))}
          </select>
          <ul className="task-list">
            {tasks.filter(task => task.projectId === selectedProject).map(task => (
              <li key={task.id} className="task-item">
                <h4>{task.name}</h4>
                <div>
                  {activeTask === task.id && startTime && (
                    <div className="time-log">
                      {formatTime(currentTime - startTime)}
                    </div>
                  )}
                  {task.timeLogs.map((log, index) => (
                    <div key={index} className="time-log">
                      Logged: {formatDuration(log.duration)}
                      <button onClick={() => editTimeLog(task.id, index)}><FaEdit /></button>
                      <button onClick={() => deleteTimeLog(task.id, index)}><FaTrash /></button>
                    </div>
                  ))}
                </div>
                <div className="actions">
                  <button onClick={() => editTask(task.id)}><FaEdit /></button>
                  <button onClick={() => deleteTask(task.id)}><FaTrash /></button>
                </div>
                <div className="timer-controls">
                  {activeTask === task.id ? (
                    <button onClick={() => stopTimer(task.id)}><FaStop /></button>
                  ) : (
                    <button onClick={() => startTimer(task.id)}><FaPlay /></button>
                  )}
                </div>
              </li>
            ))}
          </ul>
          <div className="add-form">
            <input
              type="text"
              placeholder="New task name"
              value={newTaskName}
              onChange={(e) => setNewTaskName(e.target.value)}
            />
            <button onClick={addTask}>Add Task</button>
          </div>

          {selectedProject && (
            <button className="invoice-button" onClick={() => generateInvoice(selectedProject)}>
              Generate Invoice
            </button>
          )}
        </div>
      );
    }

    export default App;
