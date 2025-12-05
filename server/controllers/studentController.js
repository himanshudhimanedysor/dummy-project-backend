const { getDatabase } = require('../database/db');
const { triggerWebhooks } = require('../services/webhookService');

const getAllStudents = async (req, res) => {
  try {
    const db = getDatabase();
    
    const [rows] = await db.query(`
      SELECT 
        s.id,
        s.name,
        s.email,
        s.phone,
        s.address,
        DATE_FORMAT(s.dateOfBirth, '%Y-%m-%d') as dateOfBirth,
        s.university_name,
        DATE_FORMAT(s.universityend_date, '%Y-%m-%d') as universityend_date,
        s.createdAt,
        s.updatedAt,
        COALESCE(
          JSON_ARRAYAGG(
            JSON_OBJECT(
              'subject', m.subject,
              'marks', m.marks,
              'maxMarks', m.maxMarks
            )
          ),
          JSON_ARRAY()
        ) as marks
      FROM students s
      LEFT JOIN marks m ON s.id = m.studentId
      GROUP BY s.id, s.name, s.email, s.phone, s.address, s.dateOfBirth, s.university_name, s.universityend_date, s.createdAt, s.updatedAt
      ORDER BY s.createdAt DESC
    `);
    
    const students = rows.map(row => ({
      ...row,
      marks: typeof row.marks === 'string' ? JSON.parse(row.marks) : (row.marks || [])
    }));
    
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getStudentById = async (req, res) => {
  try {
    const db = getDatabase();
    const studentId = req.params.id;
    
    const [students] = await db.query(`
      SELECT 
        id,
        name,
        email,
        phone,
        address,
        DATE_FORMAT(dateOfBirth, '%Y-%m-%d') as dateOfBirth,
        university_name,
        DATE_FORMAT(universityend_date, '%Y-%m-%d') as universityend_date,
        createdAt,
        updatedAt
      FROM students WHERE id = ?
    `, [studentId]);
    
    if (students.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    const student = students[0];
    
    const [marks] = await db.query(`
      SELECT * FROM marks WHERE studentId = ?
    `, [studentId]);
    
    const [exams] = await db.query(`
      SELECT * FROM exams WHERE studentId = ?
    `, [studentId]);
    
    res.json({ ...student, marks, exams: exams || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createStudent = async (req, res) => {

  const { name, email, phone, address, dateOfBirth, marks, exams, university_name, universityend_date } = req.body;

  try {
    const db = getDatabase();
    const errors = [];
    
    if (!name || name.trim() === '') {
      errors.push('Name is required');
    }
    
    if (!email || email.trim() === '') {
      errors.push('Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push('Please enter a valid email address');
    }
    
    if (!phone || phone.trim() === '') {
      errors.push('Phone number is required');
    }
    
    if (!address || address.trim() === '') {
      errors.push('Address is required');
    }
    
    if (!dateOfBirth) {
      errors.push('Date of birth is required');
    }
    
    if (!university_name || university_name.trim() === '') {
      errors.push('University name is required');
    }
    
    if (errors.length > 0) {
      return res.status(400).json({ error: errors.join('. ') });
    }

    const [existingEmail] = await db.query(`
      SELECT id FROM students WHERE email = ?
    `, [email]);
    
    if (existingEmail.length > 0) {
      return res.status(400).json({ error: `Email "${email}" already exists. Please use a different email address.` });
    }

    const [existingPhone] = await db.query(`
      SELECT id FROM students WHERE phone = ?
    `, [phone]);
    
    if (existingPhone.length > 0) {
      return res.status(400).json({ error: `Phone number "${phone}" already exists. Please use a different phone number.` });
    }

    const [result] = await db.query(`
      INSERT INTO students (name, email, phone, address, dateOfBirth, university_name, universityend_date)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [name, email, phone || null, address || null, dateOfBirth || null, university_name || null, universityend_date || null]);

    const studentId = result.insertId;

    if (marks && Array.isArray(marks) && marks.length > 0) {
      const marksValues = marks.map(m => [studentId, m.subject, m.marks, m.maxMarks || 100]);
      const placeholders = marksValues.map(() => '(?, ?, ?, ?)').join(', ');
      const flatValues = marksValues.flat();

      await db.query(`
        INSERT INTO marks (studentId, subject, marks, maxMarks)
        VALUES ${placeholders}
      `, flatValues);
    }

    if (exams && Array.isArray(exams) && exams.length > 0) {
      const examsValues = exams.map(e => [
        studentId,
        e.exam_name,
        e.exam_date,
        e.start_time,
        e.end_time,
        e.room_number,
        e.exam_type
      ]);
      const placeholders = examsValues.map(() => '(?, ?, ?, ?, ?, ?, ?)').join(', ');
      const flatValues = examsValues.flat();

      await db.query(`
        INSERT INTO exams (studentId, exam_name, exam_date, start_time, end_time, room_number, exam_type)
        VALUES ${placeholders}
      `, flatValues);
    }

    const [rows] = await db.query(`
      SELECT 
        s.id,
        s.name,
        s.email,
        s.phone,
        s.address,
        DATE_FORMAT(s.dateOfBirth, '%Y-%m-%d') as dateOfBirth,
        s.university_name,
        DATE_FORMAT(s.universityend_date, '%Y-%m-%d') as universityend_date,
        s.createdAt,
        s.updatedAt,
        COALESCE(
          JSON_ARRAYAGG(
            JSON_OBJECT(
              'subject', m.subject,
              'marks', m.marks,
              'maxMarks', m.maxMarks
            )
          ),
          JSON_ARRAY()
        ) AS marks
      FROM students s
      LEFT JOIN marks m ON s.id = m.studentId
      WHERE s.id = ?
      GROUP BY s.id, s.name, s.email, s.phone, s.address, s.dateOfBirth, s.university_name, s.universityend_date, s.createdAt, s.updatedAt
    `, [studentId]);

    const [examsData] = await db.query(`
      SELECT * FROM exams WHERE studentId = ?
    `, [studentId]);

    const student = rows[0];
    const studentData = {
      ...student,
      marks: student.marks 
        ? (typeof student.marks === 'string' ? JSON.parse(student.marks) : (student.marks || []))
        : [],
      exams: examsData || []
    };

    triggerWebhooks('CREATE', studentData);

    res.status(201).json(studentData);

  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY' || err.message.includes('Duplicate entry')) {
      if (err.message.includes('phone')) {
        return res.status(400).json({ error: `Phone number "${phone}" already exists. Please use a different phone number.` });
      }
      return res.status(400).json({ error: `Email "${email}" already exists. Please use a different email address.` });
    }
    res.status(500).json({ error: err.message });
  }
};


const updateStudent = async (req, res) => {
  const { marks, exams, universityend_date } = req.body;

  try {
    const db = getDatabase();
    const studentId = req.params.id;
    
    const [oldStudents] = await db.query(`
      SELECT 
        DATE_FORMAT(universityend_date, '%Y-%m-%d') as universityend_date
      FROM students WHERE id = ?
    `, [studentId]);
    
    if (oldStudents.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    const [oldMarks] = await db.query(`
      SELECT * FROM marks WHERE studentId = ?
    `, [studentId]);
    
    const [oldExams] = await db.query(`
      SELECT * FROM exams WHERE studentId = ?
    `, [studentId]);
    
    const oldUniversityEndDate = oldStudents[0].universityend_date;
    const oldMarksData = oldMarks || [];
    const oldExamsData = oldExams || [];
    
    const updatedFields = {};
    
    if (universityend_date !== undefined) {
      const [result] = await db.query(`
        UPDATE students 
        SET universityend_date = ?, updatedAt = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [universityend_date || null, studentId]);
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Student not found' });
      }
      updatedFields.universityend_date = universityend_date || null;
    }
    
 
    if (marks && Array.isArray(marks)) {
      await db.query(`DELETE FROM marks WHERE studentId = ?`, [studentId]);
      
      if (marks.length > 0) {
        const marksValues = marks.map(mark => [
          studentId,
          mark.subject,
          mark.marks,
          mark.maxMarks || 100
        ]);
        
        const placeholders = marksValues.map(() => '(?, ?, ?, ?)').join(', ');
        const flatValues = marksValues.flat();
        
        await db.query(`
          INSERT INTO marks (studentId, subject, marks, maxMarks)
          VALUES ${placeholders}
        `, flatValues);
      }
      updatedFields.marks = true;
    }

    if (exams && Array.isArray(exams)) {
      await db.query(`DELETE FROM exams WHERE studentId = ?`, [studentId]);
      
      if (exams.length > 0) {
        const examsValues = exams.map(e => [
          studentId,
          e.exam_name,
          e.exam_date,
          e.start_time,
          e.end_time,
          e.room_number,
          e.exam_type
        ]);
        
        const placeholders = examsValues.map(() => '(?, ?, ?, ?, ?, ?, ?)').join(', ');
        const flatValues = examsValues.flat();
        
        await db.query(`
          INSERT INTO exams (studentId, exam_name, exam_date, start_time, end_time, room_number, exam_type)
          VALUES ${placeholders}
        `, flatValues);
      }
         updatedFields.exams = true;
    }
    
    const [students] = await db.query(`
      SELECT 
        s.id,
        s.name,
        s.email,
        s.phone,
        s.address,
        DATE_FORMAT(s.dateOfBirth, '%Y-%m-%d') as dateOfBirth,
        s.university_name,
        DATE_FORMAT(s.universityend_date, '%Y-%m-%d') as universityend_date,
        s.createdAt,
        s.updatedAt,
        COALESCE(
          JSON_ARRAYAGG(
            JSON_OBJECT(
              'subject', m.subject,
              'marks', m.marks,
              'maxMarks', m.maxMarks
            )
          ),
          JSON_ARRAY()
        ) as marks
      FROM students s
      LEFT JOIN marks m ON s.id = m.studentId
      WHERE s.id = ?
      GROUP BY s.id, s.name, s.email, s.phone, s.address, s.dateOfBirth, s.university_name, s.universityend_date, s.createdAt, s.updatedAt
    `, [studentId]);

    const [examsData] = await db.query(`
      SELECT * FROM exams WHERE studentId = ?
    `, [studentId]);
    
    const student = students[0];
    const studentData = {
      ...student,
      marks: typeof student.marks === 'string' ? JSON.parse(student.marks) : (student.marks || []),
      exams: examsData || []
    };
    
     const changes = {};
    
    if ('universityend_date' in req.body) {
      const newUniversityEndDate = student.universityend_date;
      const oldDate = oldUniversityEndDate || null;
      const newDate = newUniversityEndDate || null;
      if (oldDate !== newDate) {
        if (newDate !== null && newDate !== undefined) {
          changes.universityend_date = newDate;
        }
      }
    }
    
    if ('marks' in req.body) {
      const parsedMarks = typeof student.marks === 'string' ? JSON.parse(student.marks) : (student.marks || []);
      const validMarks = parsedMarks.filter(mark => 
        mark && mark.subject && mark.marks !== null && mark.marks !== undefined && mark.marks !== ''
      );
      
      const oldMarksMap = new Map();
      oldMarksData.forEach(m => {
        oldMarksMap.set(m.subject, { marks: m.marks, maxMarks: m.maxMarks });
      });
      
      const newMarksMap = new Map();
      validMarks.forEach(m => {
        newMarksMap.set(m.subject, { marks: m.marks, maxMarks: m.maxMarks });
      });
      
      const changedMarks = [];
      validMarks.forEach(mark => {
        const oldMark = oldMarksMap.get(mark.subject);
     
        if (!oldMark || 
            oldMark.marks !== mark.marks || 
            oldMark.maxMarks !== mark.maxMarks) {
          changedMarks.push(mark);
        }
      });
      
      oldMarksData.forEach(oldMark => {
        if (!newMarksMap.has(oldMark.subject)) {
        }
      });
  
      if (changedMarks.length > 0) {
        changes.marks = changedMarks.map(mark => ({
          ...mark,
          id: studentId,
          studentId: studentId
        }));
      }
    }
    
    if ('exams' in req.body) {
      const validExams = (examsData || []).filter(exam => 
        exam && exam.exam_name && exam.exam_date
      );
      
      const normalizeDate = (dateValue) => {
        if (!dateValue) return '';
        
        let dateStr = dateValue;
        if (dateValue instanceof Date) {
          dateStr = dateValue.toISOString();
        } else if (typeof dateValue !== 'string') {
          dateStr = String(dateValue);
        }
        
        if (typeof dateStr === 'string' && dateStr.includes('T')) {
          return dateStr.split('T')[0];
        }
        return dateStr;
      };
      
      const normalizeTime = (timeValue) => {
        if (!timeValue) return '';
        const timeStr = String(timeValue);
        if (timeStr.length > 5) {
          return timeStr.substring(0, 5);
        }
        return timeStr;
      };

      const requestExams = Array.isArray(exams) ? exams.filter(e => e && e.exam_name && e.exam_date) : [];
      const changedExams = [];
      const maxLength = Math.max(oldExamsData.length, requestExams.length);

      for (let i = 0; i < maxLength; i++) {
        const oldExam = oldExamsData[i];
        const requestExam = requestExams[i];

        if (!requestExam) {
          continue;
        }

        if (!oldExam) {
          if (validExams[i]) {
            changedExams.push(validExams[i]);
          }
          continue;
        }

        const oldDate = normalizeDate(oldExam.exam_date);
        const requestDate = normalizeDate(requestExam.exam_date);
        const oldStartTime = normalizeTime(oldExam.start_time);
        const requestStartTime = normalizeTime(requestExam.start_time);
        const oldEndTime = normalizeTime(oldExam.end_time);
        const requestEndTime = normalizeTime(requestExam.end_time);

        const hasChanged = (
          (oldExam.exam_name || '') !== (requestExam.exam_name || '') ||
          oldDate !== requestDate ||
          oldStartTime !== requestStartTime ||
          oldEndTime !== requestEndTime ||
          (oldExam.room_number || '') !== (requestExam.room_number || '') ||
          (oldExam.exam_type || '') !== (requestExam.exam_type || '')
        );

        if (hasChanged) {
          if (validExams[i]) {
            changedExams.push(validExams[i]);
          }
        }
      }

 
      if (requestExams.length > oldExamsData.length) {
        for (let i = oldExamsData.length; i < requestExams.length; i++) {
          if (validExams[i]) {
            changedExams.push(validExams[i]);
          }
        }
      }

      if (changedExams.length > 0) {
        changes.exams = changedExams;
      }
    }
    
    const webhookData = {
      changes: changes,
      data: studentData
    };
    
    triggerWebhooks('UPDATE', webhookData);
    
    res.json(studentData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


const deleteStudent = async (req, res) => {
  try {
    const db = getDatabase();
    const studentId = req.params.id;
    
    // Get student data before deletion for webhook
    const [students] = await db.query(`
      SELECT 
        s.id,
        s.name,
        s.email,
        s.phone,
        s.address,
        DATE_FORMAT(s.dateOfBirth, '%Y-%m-%d') as dateOfBirth,
        s.university_name,
        DATE_FORMAT(s.universityend_date, '%Y-%m-%d') as universityend_date,
        s.createdAt,
        s.updatedAt,
        COALESCE(
          JSON_ARRAYAGG(
            JSON_OBJECT(
              'subject', m.subject,
              'marks', m.marks,
              'maxMarks', m.maxMarks
            )
          ),
          JSON_ARRAY()
        ) as marks
      FROM students s
      LEFT JOIN marks m ON s.id = m.studentId
      WHERE s.id = ?
      GROUP BY s.id, s.name, s.email, s.phone, s.address, s.dateOfBirth, s.university_name, s.universityend_date, s.createdAt, s.updatedAt
    `, [studentId]);
    
    if (students.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    const student = students[0];
    const studentData = {
      ...student,
      marks: typeof student.marks === 'string' ? JSON.parse(student.marks) : (student.marks || [])
    };
    
     await db.query(`DELETE FROM students WHERE id = ?`, [studentId]);
    
    // Trigger webhooks
    // triggerWebhooks('DELETE', studentData);
    
    res.json({ message: 'Student deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent
};

