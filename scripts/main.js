// get user name from database

function getNameFromAuth() {
  firebase.auth().onAuthStateChanged((user) => {
    // Check if a user is signed in:
    if (user) {
      // Do something for the currently logged-in user here:
      console.log(user.uid); //print the uid in the browser console
      console.log(user.displayName); //print the user name in the browser console
      userName = user.displayName;

      //method #1:  insert with JS
      document.getElementById("name-goes-here").innerText = userName;

      //method #2:  insert using jquery
      //$("#name-goes-here").text(userName); //using jquery

      //method #3:  insert using querySelector
      //document.querySelector("#name-goes-here").innerText = userName
    } else {
      // No user is signed in.
      console.log("No user is logged in");
    }
  });
}
// getNameFromAuth(); //run the function

// Function to read the quote of the day from the Firestore "quotes" collection
// Input param is the String representing the day of the week, aka, the document name
function readQuote(day) {
  db.collection("quotes")
    .doc(day) //name of the collection and documents should matach excatly with what you have in Firestore
    .onSnapshot(
      (dayDoc) => {
        //arrow notation
        console.log("current document data: " + dayDoc.data()); //.data() returns data object
        document.getElementById("quote-goes-here").innerHTML =
          dayDoc.data().quote; //using javascript to display the data on the right place

        //Here are other ways to access key-value data fields
        //$('#quote-goes-here').text(dayDoc.data().quote);         //using jquery object dot notation
        //$("#quote-goes-here").text(dayDoc.data()["quote"]);      //using json object indexing
        //document.querySelector("#quote-goes-here").innerHTML = dayDoc.data().quote;
      },
      (error) => {
        console.log("Error calling onSnapshot", error);
      }
    );
}
// readQuote("tuesday"); //calling the function

// Write hike to database
function writeHikes() {
  //define a variable for the collection you want to create in Firestore to populate data
  var hikesRef = db.collection("hikes");

  hikesRef.add({
    code: "BBY01",
    name: "Burnaby Lake Park Trail", //replace with your own city?
    city: "Burnaby",
    province: "BC",
    level: "easy",
    details: "A lovely place for lunch walk",
    length: 10, //number value
    hike_time: 60, //number value
    lat: 49.2467097082573,
    lng: -122.9187029619698,
    last_updated: firebase.firestore.FieldValue.serverTimestamp(), //current system time
  });
  hikesRef.add({
    code: "AM01",
    name: "Buntzen Lake Trail", //replace with your own city?
    city: "Anmore",
    province: "BC",
    level: "moderate",
    details: "Close to town, and relaxing",
    length: 10.5, //number value
    hike_time: 80, //number value
    lat: 49.3399431028579,
    lng: -122.85908496766939,
    last_updated: firebase.firestore.Timestamp.fromDate(
      new Date("March 10, 2022")
    ),
  });
  hikesRef.add({
    code: "NV01",
    name: "Mount Seymour Trail", //replace with your own city?
    city: "North Vancouver",
    province: "BC",
    level: "hard",
    details: "Amazing ski slope views",
    length: 8.2, //number value
    hike_time: 120, //number value
    lat: 49.38847101455571,
    lng: -122.94092543551031,
    last_updated: firebase.firestore.Timestamp.fromDate(
      new Date("January 1, 2023")
    ),
  });
}

db.collection("hikes")
  .limit(1)
  .get()
  .then((querySnapshot) => {
    if (querySnapshot.size == 0) {
      writeHikes();
    }
  });

//------------------------------------------------------------------------------
// Input parameter is a string representing the collection we are reading from
//------------------------------------------------------------------------------
// display card to htmlbody
function displayCardsDynamically(collection) {
  let cardTemplate = document.getElementById("hikeCardTemplate"); // Retrieve the HTML element with the ID "hikeCardTemplate" and store it in the cardTemplate variable.

  db.collection(collection)
    // .where('length', >, 0) // filter but only works either where or OrderBy
    .orderBy("hike_time") // what do you want to sort by?
    .limit(3)
    .get() //the collection called "hikes"
    .then((allHikes) => {
      //var i = 1;  //Optional: if you want to have a unique ID for each hike
      allHikes.forEach((doc) => {
        //iterate thru each doc
        var title = doc.data().name; // get value of the "name" key
        var details = doc.data().details; // get value of the "details" key
        var hikeCode = doc.data().code; //get unique ID to each hike to be used for fetching right image
        var hikeLength = doc.data().length; //gets the length field
        var docID = doc.id;
        let newcard = cardTemplate.content.cloneNode(true); // Clone the HTML template to create a new card (newcard) that will be filled with Firestore data.

        //update title and text and image
        newcard.querySelector(".card-title").innerHTML = title;
        // newcard.querySelector(".card-length").innerHTML = hikeLength + "km";
        newcard.querySelector(".card-length").innerHTML =
          "Length: " +
          doc.data().length +
          " km <br>" +
          "Duration: " +
          doc.data().hike_time +
          "min <br>" +
          "Last updated: " +
          doc.data().last_updated.toDate().toLocaleDateString();
        newcard.querySelector(".card-text").innerHTML = details;
        newcard.querySelector(".card-image").src = `./images/${hikeCode}.jpg`; //Example: NV01.jpg
        newcard.querySelector("a").href = "eachHike.html?docID=" + docID;
        newcard.querySelector("i").id = "save-" + docID; //guaranteed to be unique
        // newcard.querySelector("i").onclick = () => saveBookmark(docID);

        newcard.querySelector("i").onclick = () => updateBookmark(docID);

        currentUser.get().then((userDoc) => {
          //get the user name
          var bookmarks = userDoc.data().bookmarks;
          if (bookmarks.includes(docID)) {
            document.getElementById("save-" + docID).innerText = "bookmark";
          }
        });

        //Optional: give unique ids to all elements for future use
        // newcard.querySelector('.card-title').setAttribute("id", "ctitle" + i);
        // newcard.querySelector('.card-text').setAttribute("id", "ctext" + i);
        // newcard.querySelector('.card-image').setAttribute("id", "cimage" + i);

        //attach to gallery, Example: "hikes-go-here"
        document.getElementById(collection + "-go-here").appendChild(newcard);

        //i++;   //Optional: iterate variable to serve as unique ID
      });
    });
}

// displayCardsDynamically("hikes"); //input param is the name of the collection

//-----------------------------------------------------------------------------
// This function is called whenever the user clicks on the "bookmark" icon.
// It adds the hike to the "bookmarks" array
// Then it will change the bookmark icon from the hollow to the solid version.
// This will add a reference to the hikes collection from the users without having to create a new record
//-----------------------------------------------------------------------------
function saveBookmark(hikeDocID) {
  // Manage the backend process to store the hikeDocID in the database, recording which hike was bookmarked by the user.
  currentUser
    .update({
      // Use 'arrayUnion' to add the new bookmark ID to the 'bookmarks' array.
      // This method ensures that the ID is added only if it's not already present, preventing duplicates.
      bookmarks: firebase.firestore.FieldValue.arrayUnion(hikeDocID),
    })
    // Handle the front-end update to change the icon, providing visual feedback to the user that it has been clicked.
    .then(function () {
      console.log("bookmark has been saved for" + hikeDocID);
      let iconID = "save-" + hikeDocID;
      //console.log(iconID);
      //this is to change the icon of the hike that was saved to "filled"
      document.getElementById(iconID).innerText = "bookmark";
    });
}

function updateHike(user, hikeID, isBookmarked) {
  const userRef = db.collection("users").doc(user.uid);
  const updateAction = isBookmarked
    ? firebase.firestore.FieldValue.arrayRemove(hikeID)
    : firebase.firestore.FieldValue.arrayUnion(hikeID);

  userRef
    .update({ bookmarks: updateAction })
    .then(() => {
      console.log(`Bookmark ${isBookmarked ? "removed" : "added"}`);
      // Refresh bookmarks after update
      getBookmarks(user);
    })
    .catch((error) => {
      console.error("Error updating bookmarks:", error);
    });
}

//----------------------------------------------------------
// Modified getBookmarks function with bookmark toggle
//----------------------------------------------------------
function getBookmarks(user) {
  const hikeCardGroup = document.getElementById("hikeCardGroup");
  hikeCardGroup.innerHTML = ""; // Clear current cards

  db.collection("users")
    .doc(user.uid)
    .get()
    .then((userDoc) => {
      const bookmarks = userDoc.data().bookmarks || [];

      bookmarks.forEach((thisHikeID) => {
        db.collection("hikes")
          .doc(thisHikeID)
          .get()
          .then((doc) => {
            const hikeData = doc.data();
            const newcard = document
              .getElementById("savedCardTemplate")
              .content.cloneNode(true);

            // Populate card content
            newcard.querySelector(".card-title").textContent = hikeData.name;
            newcard.querySelector(
              ".card-image"
            ).src = `./images/${hikeData.code}.jpg`;
            newcard.querySelector("a").href = `eachHike.html?docID=${doc.id}`;

            // Bookmark icon setup
            const bookmarkIcon = newcard.querySelector(".material-icons");
            bookmarkIcon.textContent = "bookmark"; // Filled icon for saved items
            bookmarkIcon.style.cursor = "pointer";
            bookmarkIcon.title = "Remove from bookmarks";

            // Add click handler for bookmark toggle
            bookmarkIcon.addEventListener("click", (e) => {
              e.preventDefault(); // Prevent link navigation
              updateHike(user, doc.id, true);
            });

            // Update card details
            const detailsElement = newcard.querySelector(".card-length");
            detailsElement.innerHTML = `
          Length: ${hikeData.length}km<br>
          Duration: ${hikeData.hike_time}min<br>
          Last updated: ${hikeData.last_updated.toDate().toLocaleDateString()}
        `;

            hikeCardGroup.appendChild(newcard);
          });
      });
    });
}

function updateBookmark(hikeDocID) {
  // Get the current user
  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      // Get a reference to the user's document
      let currentUser = db.collection("users").doc(user.uid);

      // Get the user's current bookmarks
      currentUser.get().then((userDoc) => {
        let bookmarks = userDoc.data().bookmarks;
        let iconID = "save-" + hikeDocID;
        let iconElement = document.getElementById(iconID);

        if (bookmarks.includes(hikeDocID)) {
          // If the hike is already bookmarked, remove it
          currentUser
            .update({
              bookmarks: firebase.firestore.FieldValue.arrayRemove(hikeDocID),
            })
            .then(() => {
              console.log("Bookmark removed for " + hikeDocID);
              iconElement.innerText = "bookmark_border";
            });
        } else {
          // If the hike is not bookmarked, add it
          currentUser
            .update({
              bookmarks: firebase.firestore.FieldValue.arrayUnion(hikeDocID),
            })
            .then(() => {
              console.log("Bookmark added for " + hikeDocID);
              iconElement.innerText = "bookmark";
            });
        }
      });
    } else {
      console.log("No user is signed in");
    }
  });
}

//Global variable pointing to the current user's Firestore document
var currentUser;

//Function that calls everything needed for the main page
function doAll() {
  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      currentUser = db.collection("users").doc(user.uid); //global
      // console.log(currentUser);

      // figure out what day of the week it is today
      const weekday = [
        "sunday",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
      ];
      const d = new Date();
      let day = weekday[d.getDay()];

      // the following functions are always called when someone is logged in
      readQuote(day);
      getNameFromAuth();
      displayCardsDynamically("hikes");
    } else {
      // No user is signed in.
      console.log("No user is signed in");
      window.location.href = "login.html";
    }
  });
}
doAll();
