export const stats = [
  { label: "Active Clients", value: 42, trend: "+8%" },
  { label: "Properties Tracked", value: 317, trend: "+15%" },
  { label: "Due Diligence Pending", value: 18, trend: "-5%" },
  { label: "Off-Market Matches", value: 24, trend: "+22%" },
];

export const pipeline = [
  { id: "p1", address: "17 Albert St, Brunswick VIC", stage: "SHORTLISTED", score: 87, offMarket: false },
  { id: "p2", address: "4 Park Ave, Ashfield NSW", stage: "DUE_DILIGENCE", score: 91, offMarket: true },
  { id: "p3", address: "29 View Rd, Preston VIC", stage: "SEARCHING", score: 76, offMarket: false },
  { id: "p4", address: "8 Cedar Cl, Ryde NSW", stage: "OFFER", score: 84, offMarket: true },
];

export const clients = [
  {
    id: "c1",
    name: "Amelia Cooper",
    budget: "$950k-$1.2m",
    suburbs: "Brunswick, Northcote",
    stage: "Shortlisting",
  },
  {
    id: "c2",
    name: "Jacob Smith",
    budget: "$1.4m-$1.8m",
    suburbs: "Ryde, Lane Cove",
    stage: "Due Diligence",
  },
  {
    id: "c3",
    name: "Priya Rao",
    budget: "$700k-$850k",
    suburbs: "Footscray, Sunshine",
    stage: "Searching",
  },
];

export const offMarket = [
  {
    id: "o1",
    suburb: "Hawthorn",
    state: "VIC",
    ask: "$1.85m",
    seller: "Bayside Realty",
    matchScore: 89,
  },
  {
    id: "o2",
    suburb: "Parramatta",
    state: "NSW",
    ask: "$1.1m",
    seller: "North Property Co",
    matchScore: 82,
  },
];
