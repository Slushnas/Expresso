const express = require('express');
const employeesRouter = express.Router();
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');


employeesRouter.get('/', (req, res, next) => {
    db.all(`SELECT * FROM Employee WHERE is_current_employee = 1`, (err, rows) => {
        if (err) {
            next(err);
        }
        res.status(200).send({ employees: rows });
    });
});

const validateEmployee = (req, res, next) => {
    const employee = req.body.employee;
    if (!employee || !employee.name || !employee.position || !employee.wage) {
        return res.status(400).send();
    }
    next();
};

const getAndSendEmployee = (res, id, statusCode) => {
    db.get(`SELECT * FROM Employee WHERE id = $id`,
        {
            $id: id
        }, (err, row) => {
            if (err) {
                return res.status(404).send();
            }
            res.status(statusCode).send({ employee: row });
        }
    );
};

employeesRouter.post('/', validateEmployee, (req, res, next) => {
    const employee = req.body.employee;
    db.run(`INSERT INTO Employee (name, position, wage) VALUES ($name, $position, $wage)`,
        {
            $name: employee.name,
            $position: employee.position,
            $wage: employee.wage
        }, function(err) {
            if (err) {
                next(err);
            }
            getAndSendEmployee(res, this.lastID, 201);
        }
    );
});

employeesRouter.param('employeeId', (req, res, next, id) => {
    db.get(`SELECT * FROM Employee WHERE id = $id`,
        {
            $id: id
        }, (err, row) => {
            if (err || !row) {
                return res.status(404).send();
            }
            req.employee = row;
            next();
        }
    );
});

employeesRouter.get('/:employeeId', (req, res, next) => {
    res.status(200).send({ employee: req.employee });
});

employeesRouter.put('/:employeeId', validateEmployee, (req, res, next) => {
    const employee = req.body.employee;
    db.run(`UPDATE Employee SET name = $name, position = $position, wage = $wage`,
        {
            $name: employee.name,
            $position: employee.position,
            $wage: employee.wage
        }, (err) => {
            if (err) {
                next(err);
            }
            getAndSendEmployee(res, req.params.employeeId, 200);
        }
    );
});

employeesRouter.delete('/:employeeId', (req, res, next) => {
    db.run(`UPDATE Employee SET is_current_employee = 0`, (err) => {
            if (err) {
                next(err);
            }
            getAndSendEmployee(res, req.params.employeeId, 200);
        }
    );
});


// Timesheets
const getAndSendTimesheet = (res, id, statusCode) => {
    db.get(`SELECT * FROM Timesheet WHERE id = $id`,
        {
            $id: id
        }, (err, row) => {
            if (err || !row) {
                return res.status(404).send(err);
            }
            res.status(statusCode).send({ timesheet: row });
        }
    );
};

const validateTimesheet = (req, res, next) => {
    const timesheet = req.body.timesheet;
    if (!timesheet || !timesheet.hours || !timesheet.rate || !timesheet.date) {
        return res.status(400).send();
    }
    next();
};

employeesRouter.param('timesheetId', (req, res, next, id) => {
    db.get(`SELECT * FROM Timesheet WHERE id = $id`,
        {
            $id: id
        }, (err, row) => {
            if (err || !row) {
                return res.status(404).send();
            }
            req.timesheet = row;
            next();
        }
    );
});

employeesRouter.get('/:employeeId/timesheets', (req, res, next) => {
    db.all(`SELECT * FROM Timesheet WHERE employee_id = $employee_id`,
        {
            $employee_id: req.params.employeeId
        },
        (err, rows) => {
            if (err) {
                next(err);
            }
            res.status(200).send({ timesheets: rows });
        }
    );
});

employeesRouter.post('/:employeeId/timesheets', validateTimesheet, (req, res, next) => {
    const timesheet = req.body.timesheet;
    db.run(`INSERT INTO Timesheet (hours, rate, date, employee_id) VALUES ($hours, $rate, $date, $employee_id)`,
        {
            $hours: timesheet.hours,
            $rate: timesheet.rate,
            $date: timesheet.date,
            $employee_id: req.params.employeeId
        }, function(err) {
            if (err) {
                next(err);
            }
            getAndSendTimesheet(res, this.lastID, 201);
        }
    );
});

employeesRouter.put('/:employeeId/timesheets/:timesheetId', validateTimesheet, (req, res, next) => {
    const timesheet = req.body.timesheet;
    db.run(`UPDATE Timesheet SET hours = $hours, rate = $rate, date = $date WHERE id = $id`,
        {
            $hours: timesheet.hours,
            $rate: timesheet.rate,
            $date: timesheet.date,
            $id: req.params.timesheetId
        }, (err) => {
            if (err) {
                next(err);
            }
            getAndSendTimesheet(res, req.params.timesheetId, 200);
        }
    );
});

employeesRouter.delete('/:employeeId/timesheets/:timesheetId', (req, res, next) => {
    db.run(`DELETE FROM Timesheet WHERE id = $id`,
        {
            $id: req.params.timesheetId
        }, (err) => {
            if (err) {
                next(err);
            }
            res.status(204).send();
        }
    );
});

module.exports = employeesRouter;