// This function will handle sorting, width allocation, and then laying out in HTML of events
function layOutDay(eventsArr) {
  // first clear events container in DOM
  const eventContainer = document.getElementById('event-container');
  const len = eventContainer.childNodes.length;
  for (let i = 0; i < len; i++) {
    eventContainer.removeChild(eventContainer.lastChild);  
  }

  if (eventsArr.length === 0) { return; }

  // Then sort new events based on start time, will expedite placement later
  eventsArr.sort((a, b) => a.start - b.start);
  
  // Give new properties to each event object 
  eventsArr.forEach(event => {
    event.numCollisions = 0;
    event.W = undefined;
    event.eventsCollidedWith = [];
    event.placed = false;
    event.placements = 0;
    event.title = 'Sample Item';
    event.message = 'Sample Location';
  })
  
  // Find and allocate number of collisions for each event
  findCollisions(eventsArr);

  // This function call handles 2 processes
  // 1: Calculates and sets W for each event
  // 2: Forces W to be equal for events that collide
  setEventWidths(eventsArr);

  // Creates events html object and puts them into the DOM
  putEvents(eventsArr);
}

// This function accesses the DOM, creates event HTML objects, and places them within the event container
function putEvents(eventsArr, eventContainerWidth = 600) {
  const $el = document.getElementById('event-container');

  eventsArr.forEach(event => {
    // First find taken spaces.  Use takenSpaces array to calculate next step: offset ratio
    let takenSpaces = [];
    for (let i = 0; i < event.eventsCollidedWith.length; i++) {
      if (event.eventsCollidedWith[i].placed === true) {
        takenSpaces.push(event.eventsCollidedWith[i].placement);
      }
    }
    
    // offsetRatio represents how far from the left event should be placed.
    // offsetRatio takes into account the placement of events that have already been put to the DOM
    const offsetRatio = findOpenOffsetPlace(takenSpaces, event.numCollisions);

    // Keep track of placement for other events that this event collides with
    event.placement = offsetRatio;
    
    // Create event html object
    const $event = document.createElement('div');

    // Add to css class
    $event.className = 'event';

    // Take off 5px to allow for left colored border
    // Take off extra 1px for right border
    $event.style.width = `${(event.W) - 6}px`;

    // Events are placed with absolute position relative to event container
    $event.style.top = `${event.start}px`;
    // Add 10px to leave padding room
    $event.style.left = `${10 + (event.W) * offsetRatio}px`
    
    // Set height of event, take off extra 2px for border
    $event.style.height = `${event.end - event.start - 2}px`;
    
    $title = document.createElement('p');
    $message = document.createElement('p');
    $title.className = 'event-title';
    $message.className = 'event-message';
    $title.innerHTML = event.title;
    $message.innerHTML = event.message;

    $event.appendChild($title);
    $event.appendChild($message)

    // Append to event container
    $el.appendChild($event);

    // Mark as placed
    event.placed = true;
  });
}

// Helper function for putEvents to find space for events as far to the left as possible. 
function findOpenOffsetPlace(placements, numCollisions) {
  for (let i = 0; i < numCollisions + 1; i++) {
    if (placements.indexOf(i) === -1) {
      return i;
    }
  }
  return 'error, no open spaces';
}

// This function will loop through the events and update two properties 
// of the events objects.  The first property updated is the number of collisions per event,
// and the second property updated keeps track of all collided events so that they can be checked
// later to enforce equal W.
function findCollisions(eventsArr) {
  for (let i = 0; i < eventsArr.length - 1; i++) {
    for (let j = 1 + i; j < eventsArr.length; j++) {
      if (checkForCollision(eventsArr[i], eventsArr[j])) {
        eventsArr[i].numCollisions++;
        eventsArr[j].numCollisions++;

        eventsArr[i].eventsCollidedWith.push(eventsArr[j]);
        eventsArr[j].eventsCollidedWith.push(eventsArr[i]);
      }
    }
  }
}

// This function finds the W (width) for each event then enforces equal Ws among events that have collided with each other.
function setEventWidths(eventsArr, eventContainerWidth = 600) {
  // WRatio is the denominator in fraction of the event container width that will be W
  
  eventsArr.forEach(event => {
    const WRatio = findLongestAdjacentEvents(event);

    event.W = eventContainerWidth / WRatio;

    // must adjust widths recursively so that events checked earlier are corrected
    enforceEqualEventWidths(event, event.W);
  });
}



// This is a helper function for setEventWidths that will return the largest number of adjacent events within
// a "collision group". Largest number of adjacent events is WRatio.   
function findLongestAdjacentEvents(event) {
  let collisions = event.eventsCollidedWith;
  const len = collisions.length;
  let maxLength = 1;

  for (let i = 0; i < len; i++) {
    const e = collisions.pop();
    const longestPath = collisions.filter(event => checkForCollision(e, event)).length + 2;
    maxLength = maxLength < longestPath ? longestPath : maxLength;
    collisions.unshift(e);
  }
  return maxLength;

}

// Helper function for setEventWidths that recursively checks for and enforces W equality for collided events
// Want to enforce the lowest W among collided events
function enforceEqualEventWidths(event, W) {
  event.eventsCollidedWith.forEach(otherEvent => {
    if (otherEvent.W === undefined || otherEvent.W > W) {
      otherEvent.W = W;
      enforceEqualEventWidths(otherEvent, W);
    } else if(otherEvent.W !== undefined && otherEvent.W < W) {
      event.W = otherEvent.W;
      enforceEqualEventWidths(event, otherEvent.W);
    }
  })
}


// This function returns true or false based on if two event's times collide
function checkForCollision(event1, event2) {
  const case1 = event1.start <= event2.start &&  event1.end > event2.start;
  const case2 = event1.end > event2.start && event1.end < event2.end;
  const case3 = event1.start === event2.start && event1.end === event2.end;
  
  if (case1 || case2 || case3) {
    return true
  } 
  return false;
}



/*****************************************************************************

// Quick tests

// OG test
const test1 = [ {start: 30, end: 150}, {start: 540, end: 600}, {start: 560, end: 620}, {start: 610, end: 670} ];
// OG test minus collision
const test2 = [ {start: 30, end: 150}, {start: 540, end: 600}, {start: 610, end: 670} ];
// OG with one extra collision
const test3 = [ {start: 30, end: 150}, {start: 520, end: 580}, {start: 540, end: 600}, {start: 560, end: 620}, {start: 610, end: 670} ];
// 4 the same start and end
const test4 = [ {start: 30, end: 150}, {start: 30, end: 150}, {start: 30, end: 150}, {start: 30, end: 150}];
// 3 the same start and end
const test5 = [ {start: 30, end: 150}, {start: 30, end: 150}, {start: 30, end: 150},];
// 2 the same start and end
const test6 = [ {start: 30, end: 150}, {start: 30, end: 150},];
// OG test minus one collision
const test7 = [ {start: 30, end: 150}, {start: 540, end: 600}, {start: 560, end: 620},];
// Long event with multiple collisions
const test8 = [ {start: 30, end: 700 }, {start: 50, end: 100}, {start: 50, end: 100}, {start: 50, end: 100},{start: 100, end: 160},]

// testing function finds overall highest W ratio for all events given
function calcMaxWRatio(eventsArr) {
  eventsArr.forEach(event => {
    event.numCollisions = 0;
    event.W = undefined;
    event.eventsCollidedWith = [];
    event.placed = false;
    event.placements = 0;
  })
  
  findCollisions(eventsArr);

  let maxWRatio = 1; 
  eventsArr.forEach(event => {
    const maxCollisions = Math.max(...event.eventsCollidedWith.map(e => e.numCollisions).concat(event.numCollisions));
    var test = findLongestAdjacentEvents(event);
    maxWRatio = Math.max(maxWRatio, test);
  })
  console.log('maxWRatio: ', maxWRatio);
  return maxWRatio
}

console.assert(calcMaxWRatio(test1) === 2, 'Should be 2')
console.assert(calcMaxWRatio(test2) === 1, 'Should be 1')
console.assert(calcMaxWRatio(test3) === 3, 'Should be 3')
console.assert(calcMaxWRatio(test4) === 4, 'Should be 4')
console.assert(calcMaxWRatio(test5) === 3, 'Should be 3')
console.assert(calcMaxWRatio(test6) === 2, 'Should be 2')
console.assert(calcMaxWRatio(test7) === 2, 'Should be 2')
console.assert(calcMaxWRatio(test8) === 4, 'Should be 4')

//*****************************************************************************/
