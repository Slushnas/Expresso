const express = require('express');
const menusRouter = express.Router();
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');


const validateMenu = (req, res, next) => {
    const menu = req.body.menu;
    if (!menu || !menu.title) {
        return res.status(400).send();
    }
    next();
};

const getAndSendMenu = (res, id, statusCode) => {
    db.get(`SELECT * FROM Menu WHERE id = $id`,
        {
            $id: id
        }, (err, row) => {
            if (err) {
                return res.status(404).send(err);
            }
            res.status(statusCode).send({ menu: row });
        }
    );
};

menusRouter.get('/', (req, res, next) => {
    db.all(`SELECT * FROM Menu`, (err, rows) => {
        if (err) {
            next(err);
        }
        res.status(200).send({ menus: rows });
    });
});

menusRouter.post('/', validateMenu, (req, res, next) => {
    const menu = req.body.menu;
    db.run(`INSERT INTO Menu (title) VALUES ($title)`,
        {
            $title: menu.title
        },
        function (err) {
            if (err) {
                next(err);
            }
            getAndSendMenu(res, this.lastID, 201);
        }
    );
});

menusRouter.param('menuId', (req, res, next, id) => {
    db.get(`SELECT * FROM Menu WHERE id = $id`,
        {
            $id: id
        }, (err, row) => {
            if (err || !row) {
                return res.status(404).send();
            }
            req.menu = row;
            next();
        }
    );
});

menusRouter.get('/:menuId', (req, res, next) => {
    res.status(200).send({ menu: req.menu });
});

menusRouter.put('/:menuId', validateMenu, (req, res, next) => {
    const menu = req.body.menu;
    db.run(`UPDATE Menu SET title = $title WHERE id = $id`,
        {
            $title: menu.title,
            $id: req.params.menuId
        }, (err) => {
            if (err) {
                next(err);
            }
            getAndSendMenu(res, req.params.menuId, 200);
        }
    );
});

menusRouter.delete('/:menuId', (req, res, next) => {
    db.get(`SELECT COUNT(*) FROM MenuItem WHERE menu_id = $menu_id`,
        {
            $menu_id: req.params.menuId
        }, (err, row) => {
            if (err || !row || row["COUNT(*)"] == 1) {
                return res.status(400).send();
            }
            db.run(`DELETE FROM Menu WHERE id = $id`,
                {
                    $id: req.params.menuId
                }, (err) => {
                    if (err) {
                        next(err);
                    }
                    res.status(204).send();
                }
            );
        }
    );
});

const validateMenuItem = (req, res, next) => {
    const menuItem = req.body.menuItem;
    if (!menuItem || !menuItem.name || !menuItem.description || !menuItem.inventory || !menuItem.price) {
        return res.status(400).send();
    }
    next();
};

const getAndSendMenuItem = (res, id, statusCode) => {
    db.get(`SELECT * FROM MenuItem WHERE id = $id`,
        {
            $id: id
        }, (err, row) => {
            if (err) {
                console.log(err);
                return res.status(404).send(err);
            }
            res.status(statusCode).send({ menuItem: row });
        }
    );
};

menusRouter.get('/:menuId/menu-items', (req, res, next) => {
    db.all(`SELECT * FROM MenuItem WHERE menu_id = $id`,
        {
            $id: req.params.menuId
        }, (err, rows) => {
            if (err) {
                next(err);
            }
            res.status(200).send({ menuItems: rows });
        }
    );
});

menusRouter.post('/:menuId/menu-items', validateMenuItem, (req, res, next) => {
    const menuItem = req.body.menuItem;
    db.run(`INSERT INTO MenuItem (name, description, inventory, price, menu_id) VALUES (
            $name, $description, $inventory, $price, $menu_id)`,
        {
            $name: menuItem.name,
            $description: menuItem.description,
            $inventory: menuItem.inventory,
            $price: menuItem.price,
            $menu_id: req.params.menuId
        }, function(err) {
            if (err) {
                next(err);
            }
            getAndSendMenuItem(res, this.lastID, 201);
        }
    );
});

menusRouter.param('menuItemId', (req, res, next, id) => {
    db.get(`SELECT * FROM MenuItem WHERE id = $id`,
        {
            $id: id
        }, (err, row) => {
            if (err || !row) {
                return res.status(404).send();
            }
            next();
        }
    );
});

menusRouter.put('/:menuId/menu-items/:menuItemId', validateMenuItem, (req, res, next) => {
    const menuItem = req.body.menuItem;
    db.run(`UPDATE MenuItem SET name = $name, description = $description, inventory = $inventory, price = $price WHERE id = $id`,
        {
            $name: menuItem.name,
            $description: menuItem.description,
            $inventory: menuItem.inventory,
            $price: menuItem.price,
            $id: req.params.menuItemId
        }, (err) => {
            if (err) {
                next(err);
            }
            getAndSendMenuItem(res, req.params.menuItemId, 200);
        }
    );
});

menusRouter.delete('/:menuId/menu-items/:menuItemId', (req, res, next) => {
    db.run(`DELETE FROM MenuItem WHERE id = $id`,
        {
            $id: req.params.menuItemId
        }, (err) => {
            if (err) {
                next(err);
            }
            res.status(204).send();
        }
    );
});

module.exports = menusRouter;