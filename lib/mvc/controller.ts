import { Model, Usuario, Tarea, Anuncio, LogNotificacion, VinculacionPadre } from './model';

export const Controller = {
  // Inicialización segura
  init() {
    Model.initDatabase();
  },

  // Restablecer datos semilla (útil en desarrollo)
  resetSeed() {
    Model.resetDatabase();
  },

  // Autenticación de usuario
  login(email: string, passwordHash: string): Usuario {
    this.init();
    const users = Model.getUsuarios();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      throw new Error('Credenciales incorrectas (usuario no encontrado)');
    }

    if (user.passwordHash !== passwordHash) {
      throw new Error('Credenciales incorrectas (contraseña inválida)');
    }

    Model.setCurrentUser(user);
    return user;
  },

  // Cierre de sesión
  logout(): void {
    Model.clearCurrentUser();
  },

  // Obtener usuario actual en sesión
  getCurrentUser(): Usuario | null {
    return Model.getCurrentUser();
  },

  // ADMINISTRADOR: Obtener datos para la consola
  getAdminDashboardData() {
    this.init();
    const users = Model.getUsuarios();
    const courses = Model.getCursos();
    const tasks = Model.getTareas();
    const logs = Model.getLogs();
    const aulas = Model.getAulas();

    const totalEstudiantes = users.filter(u => u.rol === 'ESTUDIANTE').length;
    const totalDocentes = users.filter(u => u.rol === 'DOCENTE').length;
    const totalCursos = courses.length;
    
    // Tareas creadas esta semana (simulación)
    const tareasCreadasEstaSemana = tasks.length;
    
    // Tasa de entrega
    const totalTareas = tasks.length;
    const tareasEntregadas = tasks.filter(t => t.estado === 'ENTREGADA').length;
    const porcentajeEntrega = totalTareas > 0 ? Math.round((tareasEntregadas / totalTareas) * 100) : 0;

    const notificacionesExito = logs.filter(l => l.estado === 'EXITO').length;
    const notificacionesFallo = logs.filter(l => l.estado === 'FALLO').length;

    const kpis = {
      totalEstudiantes,
      totalDocentes,
      totalCursos,
      tareasCreadasEstaSemana,
      porcentajeEntrega,
      totalTareas,
      tareasEntregadas,
      notificacionesExito,
      notificacionesFallo
    };

    // Retornar listado de usuarios filtrando admin para seguridad
    const usuariosList = users.filter(u => u.rol !== 'ADMIN');

    return {
      success: true,
      usuarios: usuariosList,
      aulas,
      kpis
    };
  },

  // ADMINISTRADOR: Crear un nuevo usuario
  createUser(data: { email: string; passwordHash: string; nombre: string; telefono: string; rol: 'DOCENTE' | 'ESTUDIANTE'; gradoSeccionId?: string }) {
    this.init();
    const users = Model.getUsuarios();
    
    // Validar si el email ya existe
    if (users.some(u => u.email.toLowerCase() === data.email.toLowerCase())) {
      throw new Error('El correo electrónico ya está registrado.');
    }

    const newUser: Usuario = {
      id: 'usr_' + Math.random().toString(36).substring(2, 11),
      email: data.email,
      passwordHash: data.passwordHash,
      rol: data.rol,
      nombre: data.nombre,
      telefono: data.telefono,
      colegioId: 'col-1',
      gradoSeccionId: data.rol === 'ESTUDIANTE' ? data.gradoSeccionId : undefined
    };

    users.push(newUser);
    Model.setUsuarios(users);

    // Si es estudiante y se le asignó un aula, podemos matricularlo por defecto en los cursos del aula
    if (data.rol === 'ESTUDIANTE' && data.gradoSeccionId) {
      const courses = Model.getCursos();
      const matriculas = Model.getMatriculas();
      const coursesInAula = courses.filter(c => c.gradoSeccionId === data.gradoSeccionId);
      
      coursesInAula.forEach(c => {
        matriculas.push({
          id: 'mat_' + Math.random().toString(36).substring(2, 11),
          estudianteId: newUser.id,
          cursoId: c.id
        });
      });
      Model.setMatriculas(matriculas);
    }

    return newUser;
  },

  // ADMINISTRADOR: Eliminar un usuario
  deleteUser(id: string) {
    this.init();
    let users = Model.getUsuarios();
    
    if (!users.some(u => u.id === id)) {
      throw new Error('El usuario no existe.');
    }

    // Filtrar usuario
    users = users.filter(u => u.id !== id);
    Model.setUsuarios(users);

    // Limpiar matrículas huérfanas
    let matriculas = Model.getMatriculas();
    matriculas = matriculas.filter(m => m.estudianteId !== id);
    Model.setMatriculas(matriculas);

    // Limpiar vinculaciones huérfanas
    let vinculaciones = Model.getVinculaciones();
    vinculaciones = vinculaciones.filter(
      v => v.estudianteId !== id && v.padreId !== id
    );
    Model.setVinculaciones(vinculaciones);

    return true;
  },

  // DOCENTE: Obtener cursos y tareas a su cargo
  getDocenteDashboardData(teacherId: string) {
    this.init();
    const courses = Model.getCursos().filter(c => c.docenteId === teacherId);
    const courseIds = courses.map(c => c.id);
    
    // Obtener tareas ligadas a estos cursos
    const tasks = Model.getTareas().filter(t => courseIds.includes(t.cursoId));
    
    // Enriquecer tareas para la vista
    const aulas = Model.getAulas();
    const enrichedTasks = tasks.map(t => {
      const curso = courses.find(c => c.id === t.cursoId)!;
      const aula = aulas.find(a => a.id === curso.gradoSeccionId)!;
      return {
        id: t.id,
        titulo: t.titulo,
        descripcion: t.descripcion,
        fechaEntrega: t.fechaEntrega,
        estado: t.estado,
        curso: {
          id: curso.id,
          nombre: curso.nombre,
          gradoSeccion: {
            grado: aula.grado,
            seccion: aula.seccion
          }
        }
      };
    });

    // Mapear cursos para selección en el formulario
    const coursesList = courses.map(c => {
      const aula = aulas.find(a => a.id === c.gradoSeccionId)!;
      return {
        id: c.id,
        nombre: c.nombre,
        aula: `${aula.grado} - "${aula.seccion}"`
      };
    });

    return {
      cursos: coursesList,
      tareas: enrichedTasks
    };
  },

  // DOCENTE: Crear nueva tarea escolar
  createTask(data: { titulo: string; descripcion: string; fechaEntrega: string; cursoId: string }) {
    this.init();
    const tasks = Model.getTareas();

    const newTaskId = 'tsk_' + Math.random().toString(36).substring(2, 11);
    const newTask: Tarea = {
      id: newTaskId,
      titulo: data.titulo,
      descripcion: data.descripcion,
      fechaEntrega: data.fechaEntrega,
      cursoId: data.cursoId,
      estado: 'PENDIENTE'
    };

    tasks.push(newTask);
    Model.setTareas(tasks);

    // Simular alertas de envío de WhatsApp en los logs inmediatamente
    const matriculas = Model.getMatriculas().filter(m => m.cursoId === data.cursoId);
    const logs = Model.getLogs();
    matriculas.forEach(m => {
      logs.push({
        id: 'log_' + Math.random().toString(36).substring(2, 11),
        tareaId: newTaskId,
        estudianteId: m.estudianteId,
        fechaEnvio: new Date().toISOString(),
        estado: 'EXITO' // Simulación exitosa
      });
    });
    Model.setLogs(logs);

    return newTask;
  },

  // DOCENTE: Modificar tarea existente
  updateTask(id: string, data: { titulo: string; descripcion: string; fechaEntrega: string }) {
    this.init();
    const tasks = Model.getTareas();
    const idx = tasks.findIndex(t => t.id === id);
    if (idx === -1) throw new Error('La tarea no existe.');

    tasks[idx].titulo = data.titulo;
    tasks[idx].descripcion = data.descripcion;
    tasks[idx].fechaEntrega = data.fechaEntrega;

    Model.setTareas(tasks);
    return tasks[idx];
  },

  // DOCENTE: Eliminar tarea escolar
  deleteTask(id: string) {
    this.init();
    let tasks = Model.getTareas();
    if (!tasks.some(t => t.id === id)) throw new Error('La tarea no existe.');

    tasks = tasks.filter(t => t.id !== id);
    Model.setTareas(tasks);

    // Limpiar logs ligados
    let logs = Model.getLogs();
    logs = logs.filter(l => l.tareaId !== id);
    Model.setLogs(logs);

    return true;
  },

  // DOCENTE: Difundir aviso / anuncio a estudiantes por WhatsApp
  sendAnnouncement(data: { mensaje: string; cursoId: string; docenteId: string }) {
    this.init();
    const announcements = Model.getAnuncios();
    
    const newAnuncio: Anuncio = {
      id: 'anc_' + Math.random().toString(36).substring(2, 11),
      mensaje: data.mensaje,
      fechaPublicacion: new Date().toISOString(),
      cursoId: data.cursoId,
      docenteId: data.docenteId
    };

    announcements.push(newAnuncio);
    Model.setAnuncios(announcements);

    // Registrar envíos exitosos simulados de WhatsApp en los logs
    const matriculas = Model.getMatriculas().filter(m => m.cursoId === data.cursoId);
    const logs = Model.getLogs();
    matriculas.forEach(m => {
      logs.push({
        id: 'log_' + Math.random().toString(36).substring(2, 11),
        estudianteId: m.estudianteId,
        fechaEnvio: new Date().toISOString(),
        estado: 'EXITO'
      });
    });
    Model.setLogs(logs);

    return newAnuncio;
  },

  // ESTUDIANTE: Obtener su dashboard
  getEstudianteDashboardData(studentId: string) {
    this.init();
    const matriculas = Model.getMatriculas().filter(m => m.estudianteId === studentId);
    const courseIds = matriculas.map(m => m.cursoId);
    
    // Obtener los cursos
    const users = Model.getUsuarios();
    const allCourses = Model.getCursos();
    const studentCourses = allCourses.filter(c => courseIds.includes(c.id)).map(c => {
      const docente = users.find(u => u.id === c.docenteId)!;
      return {
        id: c.id,
        nombre: c.nombre,
        descripcion: c.descripcion || '',
        docente: {
          nombre: docente.nombre,
          email: docente.email
        }
      };
    });

    // Obtener tareas de sus cursos
    const tasks = Model.getTareas().filter(t => courseIds.includes(t.cursoId));
    const studentTasks = tasks.map(t => {
      const curso = allCourses.find(c => c.id === t.cursoId)!;
      return {
        id: t.id,
        titulo: t.titulo,
        descripcion: t.descripcion,
        fechaEntrega: t.fechaEntrega,
        estado: t.estado,
        curso: {
          id: curso.id,
          nombre: curso.nombre
        }
      };
    });

    // Obtener temas del sílabo
    const syllabus = Model.getSilabos().filter(s => courseIds.includes(s.cursoId));
    const studentSyllabus = syllabus.map(s => {
      const curso = allCourses.find(c => c.id === s.cursoId)!;
      return {
        id: s.id,
        semana: s.semana,
        tema: s.tema,
        curso: {
          id: curso.id,
          nombre: curso.nombre
        }
      };
    });

    // Obtener avisos publicados en sus cursos
    const announcements = Model.getAnuncios().filter(a => courseIds.includes(a.cursoId));
    const studentAnuncios = announcements
      .map(a => {
        const curso = allCourses.find(c => c.id === a.cursoId)!;
        const docente = users.find(u => u.id === a.docenteId)!;
        return {
          id: a.id,
          mensaje: a.mensaje,
          fechaPublicacion: a.fechaPublicacion,
          curso: { id: curso.id, nombre: curso.nombre },
          docente: docente.nombre
        };
      })
      .sort((a, b) => new Date(b.fechaPublicacion).getTime() - new Date(a.fechaPublicacion).getTime());

    return {
      matriculas: studentCourses,
      tareas: studentTasks,
      silabos: studentSyllabus,
      anuncios: studentAnuncios
    };
  },

  // PADRE: Obtener hijos vinculados con datos de aula
  getHijosVinculados(padreId: string) {
    this.init();
    const vinculaciones = Model.getVinculaciones().filter(v => v.padreId === padreId);
    const usuarios = Model.getUsuarios();
    const aulas = Model.getAulas();

    return vinculaciones.map(v => {
      const estudiante = usuarios.find(u => u.id === v.estudianteId)!;
      const aula = aulas.find(a => a.id === estudiante.gradoSeccionId);
      return {
        vinculacionId: v.id,
        id: estudiante.id,
        nombre: estudiante.nombre,
        email: estudiante.email,
        aula: aula
          ? { grado: aula.grado, seccion: aula.seccion }
          : { grado: 'Sin aula', seccion: '-' },
        fechaVinculacion: v.fechaVinculacion,
      };
    });
  },

  // PADRE: Vincular un hijo mediante código institucional
  vincularEstudiante(padreId: string, codigoVinculo: string) {
    this.init();
    const codigo = codigoVinculo.trim().toUpperCase();
    if (!codigo) {
      throw new Error('Ingresa un código de vinculación válido.');
    }

    const padre = Model.getUsuarios().find(u => u.id === padreId);
    if (!padre || padre.rol !== 'PADRE') {
      throw new Error('Solo los usuarios con rol PADRE pueden vincular estudiantes.');
    }

    const estudiante = Model.getUsuarios().find(
      u => u.rol === 'ESTUDIANTE' && u.codigoVinculo?.toUpperCase() === codigo
    );
    if (!estudiante) {
      throw new Error('Código de vinculación no encontrado. Verifica con el colegio.');
    }

    const vinculaciones = Model.getVinculaciones();
    const yaVinculado = vinculaciones.some(
      v => v.padreId === padreId && v.estudianteId === estudiante.id
    );
    if (yaVinculado) {
      throw new Error(`${estudiante.nombre} ya está vinculado a tu cuenta.`);
    }

    const nuevaVinculacion: VinculacionPadre = {
      id: 'vinc_' + Math.random().toString(36).substring(2, 11),
      padreId,
      estudianteId: estudiante.id,
      fechaVinculacion: new Date().toISOString(),
    };

    vinculaciones.push(nuevaVinculacion);
    Model.setVinculaciones(vinculaciones);

    const aula = Model.getAulas().find(a => a.id === estudiante.gradoSeccionId);
    return {
      vinculacionId: nuevaVinculacion.id,
      id: estudiante.id,
      nombre: estudiante.nombre,
      email: estudiante.email,
      aula: aula
        ? { grado: aula.grado, seccion: aula.seccion }
        : { grado: 'Sin aula', seccion: '-' },
      fechaVinculacion: nuevaVinculacion.fechaVinculacion,
    };
  },

  // PADRE: Desvincular un hijo
  desvincularEstudiante(padreId: string, estudianteId: string) {
    this.init();
    let vinculaciones = Model.getVinculaciones();
    const existe = vinculaciones.some(
      v => v.padreId === padreId && v.estudianteId === estudianteId
    );
    if (!existe) {
      throw new Error('No existe una vinculación activa con este estudiante.');
    }

    vinculaciones = vinculaciones.filter(
      v => !(v.padreId === padreId && v.estudianteId === estudianteId)
    );
    Model.setVinculaciones(vinculaciones);
    return true;
  },

  // PADRE: Dashboard consolidado de hijos vinculados
  getPadreDashboardData(padreId: string, estudianteIdFiltro?: string) {
    this.init();
    const hijos = this.getHijosVinculados(padreId);
    const hijoIds = estudianteIdFiltro
      ? hijos.filter(h => h.id === estudianteIdFiltro).map(h => h.id)
      : hijos.map(h => h.id);

    const usuarios = Model.getUsuarios();
    const allCourses = Model.getCursos();
    const allTasks = Model.getTareas();
    const allSilabos = Model.getSilabos();
    const allAnuncios = Model.getAnuncios();
    const allLogs = Model.getLogs();
    const matriculas = Model.getMatriculas().filter(m => hijoIds.includes(m.estudianteId));

    const courseIds = [...new Set(matriculas.map(m => m.cursoId))];

    const tareas = matriculas
      .flatMap(m => {
        const curso = allCourses.find(c => c.id === m.cursoId)!;
        const estudiante = usuarios.find(u => u.id === m.estudianteId)!;
        return allTasks
          .filter(t => t.cursoId === m.cursoId)
          .map(t => ({
            id: t.id,
            titulo: t.titulo,
            descripcion: t.descripcion,
            fechaEntrega: t.fechaEntrega,
            estado: t.estado,
            curso: { id: curso.id, nombre: curso.nombre },
            estudiante: { id: estudiante.id, nombre: estudiante.nombre },
          }));
      })
      .sort((a, b) => new Date(a.fechaEntrega).getTime() - new Date(b.fechaEntrega).getTime());

    const cursos = matriculas.map(m => {
      const curso = allCourses.find(c => c.id === m.cursoId)!;
      const docente = usuarios.find(u => u.id === curso.docenteId)!;
      const estudiante = usuarios.find(u => u.id === m.estudianteId)!;
      return {
        id: curso.id,
        nombre: curso.nombre,
        descripcion: curso.descripcion || '',
        estudiante: { id: estudiante.id, nombre: estudiante.nombre },
        docente: { nombre: docente.nombre, email: docente.email },
      };
    });

    const silabos = matriculas.flatMap(m => {
      const curso = allCourses.find(c => c.id === m.cursoId)!;
      const estudiante = usuarios.find(u => u.id === m.estudianteId)!;
      return allSilabos
        .filter(s => s.cursoId === m.cursoId)
        .map(s => ({
          id: s.id,
          semana: s.semana,
          tema: s.tema,
          curso: { id: curso.id, nombre: curso.nombre },
          estudiante: { id: estudiante.id, nombre: estudiante.nombre },
        }));
    });

    const anuncios = allAnuncios
      .filter(a => courseIds.includes(a.cursoId))
      .map(a => {
        const curso = allCourses.find(c => c.id === a.cursoId)!;
        const docente = usuarios.find(u => u.id === a.docenteId)!;
        const estudiantesEnCurso = matriculas
          .filter(m => m.cursoId === a.cursoId)
          .map(m => usuarios.find(u => u.id === m.estudianteId)!.nombre);
        return {
          id: a.id,
          mensaje: a.mensaje,
          fechaPublicacion: a.fechaPublicacion,
          curso: { id: curso.id, nombre: curso.nombre },
          docente: docente.nombre,
          estudiantes: estudiantesEnCurso,
        };
      })
      .sort(
        (a, b) =>
          new Date(b.fechaPublicacion).getTime() - new Date(a.fechaPublicacion).getTime()
      );

    const logs = allLogs
      .filter(l => hijoIds.includes(l.estudianteId))
      .map(l => {
        const estudiante = usuarios.find(u => u.id === l.estudianteId)!;
        const tarea = l.tareaId ? allTasks.find(t => t.id === l.tareaId) : undefined;
        return {
          id: l.id,
          estudiante: { id: estudiante.id, nombre: estudiante.nombre },
          tarea: tarea ? { id: tarea.id, titulo: tarea.titulo } : undefined,
          fechaEnvio: l.fechaEnvio,
          estado: l.estado,
        };
      })
      .sort(
        (a, b) => new Date(b.fechaEnvio).getTime() - new Date(a.fechaEnvio).getTime()
      );

    const ahora = new Date();
    const tareasPendientes = tareas.filter(t => t.estado === 'PENDIENTE');
    const tareasUrgentes = tareasPendientes.filter(t => {
      const diffHours =
        (new Date(t.fechaEntrega).getTime() - ahora.getTime()) / (1000 * 60 * 60);
      return diffHours >= 0 && diffHours < 24;
    });

    const resumen = {
      totalHijos: hijos.length,
      tareasPendientes: tareasPendientes.length,
      tareasUrgentes: tareasUrgentes.length,
      tareasEntregadas: tareas.filter(t => t.estado === 'ENTREGADA').length,
      notificacionesExito: logs.filter(l => l.estado === 'EXITO').length,
      notificacionesFallo: logs.filter(l => l.estado === 'FALLO').length,
    };

    return {
      hijos,
      resumen,
      tareas,
      cursos,
      silabos,
      anuncios,
      logs,
    };
  }
};
