import { prisma } from './prisma';
import bcrypt from 'bcryptjs';

export async function seedDatabaseProgrammatically() {
  console.log('[Autoseed] Iniciando autoseed...');

  // 1. Crear Colegio
  const colegio = await prisma.colegio.create({
    data: {
      nombre: 'Colegio Anglo Americano',
      direccion: 'Av. Las Palmeras 123, Lima',
      licenciaActiva: true,
    },
  });
  console.log(`[Autoseed] Colegio creado: ${colegio.nombre}`);

  // 2. Crear Usuarios (Hash de contraseñas)
  const salt = bcrypt.genSaltSync(10);
  const passwordHashAdmin = bcrypt.hashSync('admin123', salt);
  const passwordHashDocente = bcrypt.hashSync('docente123', salt);
  const passwordHashEstudiante = bcrypt.hashSync('alumno123', salt);

  // Admin
  const admin = await prisma.usuario.create({
    data: {
      email: 'admin@colegio.edu.pe',
      passwordHash: passwordHashAdmin,
      rol: 'ADMIN',
      nombre: 'Sofía Rodríguez (Admin)',
      telefono: '+51987654321',
      colegioId: colegio.id,
    },
  });

  // Docentes
  const docenteMath = await prisma.usuario.create({
    data: {
      email: 'juan.perez@colegio.edu.pe',
      passwordHash: passwordHashDocente,
      rol: 'DOCENTE',
      nombre: 'Prof. Juan Pérez (Matemáticas)',
      telefono: '+51900000001',
      colegioId: colegio.id,
    },
  });

  const docenteScience = await prisma.usuario.create({
    data: {
      email: 'maria.gomez@colegio.edu.pe',
      passwordHash: passwordHashDocente,
      rol: 'DOCENTE',
      nombre: 'Prof. María Gómez (Ciencias)',
      telefono: '+51900000002',
      colegioId: colegio.id,
    },
  });

  // Estudiantes
  const alumno1 = await prisma.usuario.create({
    data: {
      email: 'pedrito@colegio.edu.pe',
      passwordHash: passwordHashEstudiante,
      rol: 'ESTUDIANTE',
      nombre: 'Pedro Alcántara',
      telefono: '+51900000101',
      colegioId: colegio.id,
    },
  });

  const alumno2 = await prisma.usuario.create({
    data: {
      email: 'lucia@colegio.edu.pe',
      passwordHash: passwordHashEstudiante,
      rol: 'ESTUDIANTE',
      nombre: 'Lucía Fernández',
      telefono: '+51900000102',
      colegioId: colegio.id,
    },
  });

  const alumno3 = await prisma.usuario.create({
    data: {
      email: 'carlos@colegio.edu.pe',
      passwordHash: passwordHashEstudiante,
      rol: 'ESTUDIANTE',
      nombre: 'Carlos Mendoza',
      telefono: '+51900000103',
      colegioId: colegio.id,
    },
  });

  console.log('[Autoseed] Usuarios creados.');

  // 3. Crear GradoSeccion (Aulas)
  const quintoA = await prisma.gradoSeccion.create({
    data: {
      grado: '5to de Primaria',
      seccion: 'A',
      colegioId: colegio.id,
    },
  });

  const primeroB = await prisma.gradoSeccion.create({
    data: {
      grado: '1ro de Secundaria',
      seccion: 'B',
      colegioId: colegio.id,
    },
  });

  // 4. Crear Cursos
  const cursoMath = await prisma.curso.create({
    data: {
      nombre: 'Álgebra y Geometría',
      descripcion: 'Curso fundamental de matemáticas para 5to de Primaria',
      gradoSeccionId: quintoA.id,
      docenteId: docenteMath.id,
    },
  });

  const cursoScience = await prisma.curso.create({
    data: {
      nombre: 'Ciencia y Tecnología',
      descripcion: 'Estudio de la biodiversidad, química y física experimental',
      gradoSeccionId: quintoA.id,
      docenteId: docenteScience.id,
    },
  });

  const cursoMathSec = await prisma.curso.create({
    data: {
      nombre: 'Matemática Avanzada I',
      descripcion: 'Introducción al Álgebra y Trigonometría',
      gradoSeccionId: primeroB.id,
      docenteId: docenteMath.id,
    },
  });

  // 5. Matricular Estudiantes
  await prisma.matricula.createMany({
    data: [
      { estudianteId: alumno1.id, cursoId: cursoMath.id },
      { estudianteId: alumno1.id, cursoId: cursoScience.id },
      { estudianteId: alumno2.id, cursoId: cursoMath.id },
      { estudianteId: alumno2.id, cursoId: cursoScience.id },
      { estudianteId: alumno3.id, cursoId: cursoMathSec.id },
    ],
  });

  // 6. Crear Sílabos
  await prisma.silabo.createMany({
    data: [
      { semana: 1, tema: 'Introducción a los números enteros', cursoId: cursoMath.id },
      { semana: 2, tema: 'Ecuaciones de primer grado elementales', cursoId: cursoMath.id },
      { semana: 3, tema: 'Teoría de conjuntos y diagramas', cursoId: cursoMath.id },
      { semana: 1, tema: 'El ecosistema y los seres vivos', cursoId: cursoScience.id },
      { semana: 2, tema: 'La célula eucariota y procariota', cursoId: cursoScience.id },
    ],
  });

  // 7. Crear Tareas
  const hoy = new Date();
  const mañana = new Date(hoy);
  mañana.setDate(hoy.getDate() + 1);
  mañana.setHours(12, 0, 0, 0);

  const enDosDias = new Date(hoy);
  enDosDias.setDate(hoy.getDate() + 2);
  enDosDias.setHours(18, 0, 0, 0);

  const enCincoDias = new Date(hoy);
  enCincoDias.setDate(hoy.getDate() + 5);
  enCincoDias.setHours(23, 59, 0, 0);

  await prisma.tarea.create({
    data: {
      titulo: 'Resolución de Ecuaciones Lineales',
      descripcion: 'Resolver los ejercicios del 1 al 10 de la página 45 del libro.',
      fechaEntrega: mañana,
      cursoId: cursoMath.id,
      estado: 'PENDIENTE',
    },
  });

  await prisma.tarea.create({
    data: {
      titulo: 'Maqueta de la Célula Vegetal',
      descripcion: 'Elaborar una maqueta usando materiales reciclados y etiquetar sus partes.',
      fechaEntrega: enDosDias,
      cursoId: cursoScience.id,
      estado: 'PENDIENTE',
    },
  });

  await prisma.tarea.create({
    data: {
      titulo: 'Áreas y Volúmenes de Polígonos',
      descripcion: 'Graficar y calcular el área y volumen de las figuras geométricas mostradas en clase.',
      fechaEntrega: enCincoDias,
      cursoId: cursoMath.id,
      estado: 'PENDIENTE',
    },
  });

  await prisma.tarea.create({
    data: {
      titulo: 'Investigación sobre la fotosíntesis',
      descripcion: 'Monografía breve explicando la fase luminosa y oscura de la fotosíntesis.',
      fechaEntrega: new Date(hoy.getTime() - 24 * 60 * 60 * 1000),
      cursoId: cursoScience.id,
      estado: 'ENTREGADA',
    },
  });

  // 8. Anuncios
  await prisma.anuncio.create({
    data: {
      mensaje: 'Recuerden que la próxima semana tendremos la evaluación bimestral de Álgebra.',
      cursoId: cursoMath.id,
      docenteId: docenteMath.id,
    },
  });

  console.log('[Autoseed] Autoseed completado con éxito.');
}
