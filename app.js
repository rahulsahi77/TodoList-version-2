//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');
  
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect('mongodb://localhost:27017/todolistDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('Connected to MongoDB!')).catch(err => console.error(err));

// Mongoose Schema
const itemsSchema = new mongoose.Schema({
  name: String
});

// Declaring the Model
const Item = mongoose.model('Item', itemsSchema);

// Few doduments for the collection
const item1 = new Item({
  name: "Welcome to your todolist1!"
});
const item2 = new Item({
  name: "Welcome to your todolist2!"
});
const item3 = new Item({
  name: "Welcome to your todolist3!"
});
const defaultItems = [item1, item2, item3];

// new Diff Schema
const listSchema = {
  name: String,
  items: [itemsSchema]
};
const List = mongoose.model("List", listSchema);

app.get('/', async (req, res) => {
  const foundItems = await Item.find({});
  if (foundItems.length === 0) {
    await Item.insertMany(defaultItems);
    res.redirect('/');
  } else {
    res.render('list', { listTitle: 'Today', newListItems: foundItems });
  }
});



app.get('/:customListName', async (req, res) => {
  const customListName = _.capitalize(req.params.customListName);
  const listExists = await List.findOne({ name: customListName });
  if (listExists) {
    res.render("list", { listTitle: listExists.name, newListItems: listExists.items })
  } else {
    const list = new List({
      name: customListName,
      items: defaultItems,
    });
    await list.save();
    res.redirect("/" + customListName);
  }
});


app.post("/", async (req, res) => {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  if (listName === "Today") {
    const item = new Item({ name: itemName });
    await item.save();
    res.redirect("/");
  } else {
    const list = await List.findOne({ name: listName });
    const item = new Item({ name: itemName });
    list.items.push(item);
    await list.save();
    res.redirect("/" + listName);
  }
});


app.post("/delete", async (req, res) => {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
  if (listName === "Today") {
    await Item.findByIdAndDelete(checkedItemId);
    res.redirect("/");
  } else {
    await List.findOneAndUpdate({name : listName}, {$pull: {items :{_id :checkedItemId}}});
    res.redirect("/" + listName);
  }
 
});

app.get("/work", (req, res) => {
  res.render("list", { listTitle: "Work List", newListItems: workItems });
});

app.get("/about", (req, res) => {
  res.render("about");
});

app.listen(3000, () => {
  console.log("Server started on port 3000");
});



