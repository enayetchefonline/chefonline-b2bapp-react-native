// utils/apiService.js
import api from './api';

// Example: login
export const loginUser = async ({ username, password, platform, token }) => {
  const url = `Tigger.php?funId=37&username=${username}&password=${password}&device_id=0&platform=${platform}&token=${token}`;
  console.log('login url', url);
  const response = await api.get(url);
  return response.data;
};

export const getRestaurantSummaryData = async ({ rest_id }) => {
  const url = `Tigger.php?funId=142&rest_id=${rest_id}`;
  console.log('get restaurant summary url', url);
  const response = await api.get(url);
  return response.data;
};

export const getOrderList = async ({ rest_id, startDate, endDate }) => {
  const url = `Tigger.php?funId=33&rest_id=${rest_id}&start_date=${startDate}&end_date=${endDate}`;
  console.log('get order list url', url);
  const response = await api.get(url);
  return response.data;
};

export const getFaqs = async () => {
  const url = 'Tigger.php?funId=143';
  console.log('get faqs url', url);
  const response = await api.get(url);
  return response.data;
};

export const getReservationList = async ({ rest_id, start_date, end_date, status }) => {
    console.log(
      'rest_id',
      rest_id,
      'start_date',
      start_date,
      'end_date',
      end_date,
      'status',
      status
    );
    const url = `Tigger.php?funId=86&rest_id=${rest_id}&start_date=${start_date}&end_date=${end_date}&status=${status}`;
    console.log('get reservation list url', url);
    const response = await api.get(url);
    console.log('response', response.data);
  return response.data;
};

// --- PIN / Settings helpers ---
export const checkPinStatus = async ({ user_id }) => {
  const url = `Tigger.php?funId=91&user_id=${user_id}`;
  const res = await api.get(url);
  return res.data;
};

export const setPin = async ({ user_id, pincode }) => {
  const url = `Tigger.php?funId=87&user_id=${user_id}&pincode=${pincode}`;
  const res = await api.get(url);
  return res.data;
};

export const verifyPin = async ({ user_id, pincode }) => {
  const url = `Tigger.php?funId=89&user_id=${user_id}&pincode=${pincode}`;
  const res = await api.get(url);
  return res.data;
};

export const requestPinReset = async ({ user_id, mobile_no }) => {
  const url = `Tigger.php?funId=90&user_id=${user_id}&mobile_no=${mobile_no}`;
  const res = await api.get(url);
  return res.data;
};

// funId=145: get today's online order (shift) status for a restaurant
export const getOnlineShiftStatus = async ({ rest_id }) => {
  const url = `Tigger.php?funId=145&rest_id=${encodeURIComponent(rest_id)}`;
  const res = await api.get(url);

  return res.data;
};

// funId=144: set today's online order (shift) status
// status: '1' => Closed, '0' => Open
export const setOnlineShiftStatus = async ({ rest_id, user_id, status }) => {
  const url = `Tigger.php?funId=144&rest_id=${encodeURIComponent(rest_id)}&user_id=${encodeURIComponent(user_id)}&status=${encodeURIComponent(status)}`;
  console.log('setOnlineShiftStatus url', url);
  const res = await api.get(url);

  return res.data;
};

export const logoutUser = async ({ user_id, platform, token }) => {
  // keep device_id as 0/null per your old usage
  const url = `Tigger.php?funId=73&user_id=${user_id}&device_id=0&token=${token}&platform_id=${platform}`;
  const res = await api.get(url);
  return res.data;
};

export const getOpeningHours = async ({ rest_id }) => {
  // keep device_id as 0/null per your old usage
  const url = `Tigger.php?funId=133&rest_id=${rest_id}`;
  const res = await api.get(url);
  return res.data;
};

export const closeShift = async ({ id }) => {
  const url = `Tigger.php?funId=136&id=${id}`;
  const res = await api.get(url);
  return res.data;
};

export const editShift = async ({ id, opening_unix, closing_unix }) => {
  const url = `Tigger.php?funId=135&id=${id}&opening_time=${opening_unix}&closing_time=${closing_unix}`;
  const res = await api.get(url);
  return res.data;
};

export const addNewShift = async ({
  rest_id,
  weekday, // dayNo
  opening_unix,
  closing_unix,
  shift, // shiftNo
  type = 3, // your code uses type=3
}) => {
  const url =
    `Tigger.php?funId=137` +
    `&rest_id=${rest_id}` +
    `&weekday=${weekday}` +
    `&opening_time=${opening_unix}` +
    `&closing_time=${closing_unix}` +
    `&shift=${shift}` +
    `&type=${type}`;
  const res = await api.get(url);
  return res.data;
};

/** Get Delivery/Collection minutes for each day/shift (funId=138) */
export const getDelColTimes = async ({ rest_id }) => {
  const url = `Tigger.php?funId=138&rest_id=${rest_id}`;
  const res = await api.get(url);
  // old screen used response.data.opening_shift
  return res.data;
};

/** Close one policy-time record by id (funId=139) */
export const closePolicyTime = async ({ id }) => {
  const url = `Tigger.php?funId=139&id=${id}`;
  const res = await api.get(url);
  return res.data;
};

/** Edit minutes for an existing policy-time record (funId=140) */
export const editPolicyTime = async ({ id, minutes }) => {
  const url = `Tigger.php?funId=140&id=${id}&minutes=${minutes}`;
  const res = await api.get(url);
  return res.data;
};

/** Add new policy-time for a day/shift/policy (funId=141) */
export const addPolicyTime = async ({ rest_id, day_no, policy_id, minutes, shift_no }) => {
  const url =
    `Tigger.php?funId=141` +
    `&rest_id=${rest_id}` +
    `&day_no=${day_no}` +
    `&policy_id=${policy_id}` +
    `&minutes=${minutes}` +
    `&shift_no=${shift_no}`;

  console.log('addPolicyTime url', url);
  const res = await api.get(url);
  return res.data;
};

/** List tickets (funId=107) */
export const getTicketList = async ({ user_id, pincode, limit = 0 }) => {
  const url = `Tigger.php?funId=107&user_id=${user_id}&pincode=${pincode}&limit=${limit}`;
  const res = await api.get(url);
  return res.data; // { status, complains: [...] }
};

/** Filter tickets (funId=110)  complain_status: 1=PENDING, 2=RESOLVED */
export const filterTicketList = async ({ user_id, complain_status, limit = 0 }) => {
  const url = `Tigger.php?funId=110&user_id=${user_id}&ticket_id=&title=&complain_status=${complain_status}&limit=${limit}`;
  const res = await api.get(url);
  return res.data; // { status, complains: [...] }
};

/** Create ticket (funId=108) with base64 images array */
export const createTicket = async ({
  user_id,
  pincode,
  message,
  files = [], // array of base64 strings (no data: prefix; just raw)
}) => {
  const form = new URLSearchParams();
  form.append('funId', '108');
  form.append('file', JSON.stringify(files));
  form.append('user_id', String(user_id));
  form.append('ticket_id', '0');
  form.append('pincode', String(pincode));
  form.append('message', message);
  form.append('complain_status', '1'); // pending
  form.append('ticket_type', '0');

  const res = await api.post('Tigger.php', form, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
  });
  return res.data; // { message, ... }
};

// List all invoices for a restaurant (funId=131)
export const getInvoiceList = async ({ rest_id }) => {
  const url = `Tigger.php?funId=131&rest_id=${rest_id}`;
  console.log('get invoice list url', url);
  const res = await api.get(url);
  // API returns an array like: [{ week_no, InvoiceNo, InvYear, id? }, ...]
  return res.data;
};

// Build a direct API download URL (funId=132)
// Useful for <WebView source={{ uri: getInvoiceDownloadUrl(InvoiceNo) }}>
export const getInvoiceDownloadUrl = (invoice_id) => {
  const base = api && api.defaults && api.defaults.baseURL ? api.defaults.baseURL : '';
  return `${base}Tigger.php?funId=132&invoice_id=${encodeURIComponent(invoice_id)}`;
};

// Build the Backoffice details page URL (for viewing in WebView)
export const getInvoiceDetailsPageUrl = (invoice_id) =>
  `https://backoffice.chefonline.co.uk/invoice/details/${encodeURIComponent(invoice_id)}`;

// --- Reviews ---

// funId=102: list reviews
export const getReviews = async ({ rest_id }) => {
  const url = `Tigger.php?funId=102&rest_id=${rest_id}`;
  console.log('get reviews url', url);
  const res = await api.get(url);
  return res.data; // { status: 'Success', data: [...] }
};

// funId=103: change review status (0=unpublish, 1=publish)
export const updateReviewStatus = async ({ review_id, status }) => {
  const url = `Tigger.php?funId=103&review_id=${review_id}&status=${status}`;
  const res = await api.get(url);
  return res.data; // { status, msg }
};

// funId=104: reply to review (reply_by=1 means restaurant)
export const postReviewReply = async ({ review_id, reply_msg, reply_by = 1 }) => {
  const q = encodeURIComponent(reply_msg);
  const url = `Tigger.php?funId=104&review_id=${review_id}&reply_by=${reply_by}&reply_msg=${q}`;

  console.log('postReviewReply url', url);
  const res = await api.get(url);
  return res.data; // { status, msg }
};

// Change Backoffice Password (funId=10)
export const changeBackofficePassword = async ({ email, previouspassword, newpassword }) => {
  const url = `Tigger.php?funId=10&email=${encodeURIComponent(email)}&previouspassword=${encodeURIComponent(previouspassword)}&newpassword=${encodeURIComponent(newpassword)}`;
  const res = await api.get(url);
  return res.data; // { status: 'Success'|'Failed', msg: '...' }
};

// Change device pincode (funId=88)
export const changeDevicePincode = async ({ user_id, old_pincode, new_pincode }) => {
  const url = `Tigger.php?funId=88&user_id=${encodeURIComponent(
    user_id
  )}&old_pincode=${encodeURIComponent(old_pincode)}&new_pincode=${encodeURIComponent(new_pincode)}`;
  const res = await api.get(url);
  return res.data; // { status: 'Success'|'Failed', msg: '...' }
};


// --- Reservation Settings ---

// funId=59: read settings
export const getReservationSettings = async ({ rest_id }) => {
    const url = `Tigger.php?funId=59&rest_id=${encodeURIComponent(rest_id)}`;
    console.log('get reservation settings url', url);
    const res = await api.get(url);
    return res.data;
};

// funId=58: toggle accept_reservation
export const setAcceptReservation = async ({ rest_id, accept }) => {
    const url = `Tigger.php?funId=58&rest_id=${encodeURIComponent(rest_id)}&accept_reservation=${encodeURIComponent(accept)}`;
    console.log('setAcceptReservation url', url);
    const res = await api.get(url);
    return res.data;
};

// funId=57: toggle is_auto_reservation
export const setAutoReservation = async ({ rest_id, auto }) => {
    const url = `Tigger.php?funId=57&rest_id=${encodeURIComponent(rest_id)}&is_auto_reservation=${encodeURIComponent(auto)}`;
    console.log('setAutoReservation url', url);
    const res = await api.get(url);
    return res.data;
};

// --- Reservation Hours (type=4 = reservation) ---
/**
 * GET opening hours (days + shifts)
 * funId=134
 */
export const getReservationHours = async ({ rest_id }) => {
    const url = `Tigger.php?funId=134&rest_id=${encodeURIComponent(rest_id)}`;
    console.log('getReservationHours url', url);
    const res = await api.get(url);
    return res.data;
};

/**
 * EDIT a shift's open/close time
 * funId=135
 */
export const editReservationShift = async ({ id, opening_unix, closing_unix }) => {
    const url = `Tigger.php?funId=135&id=${encodeURIComponent(id)}&opening_time=${encodeURIComponent(opening_unix)}&closing_time=${encodeURIComponent(closing_unix)}`;
    console.log('editReservationShift url', url);
    const res = await api.get(url);
    return res.data;
};

/**
 * CLOSE (remove/disable) a shift
 * funId=136
 */
export const closeReservationShift = async ({ id }) => {
    const url = `Tigger.php?funId=136&id=${encodeURIComponent(id)}`;
    console.log('closeReservationShift url', url);
    const res = await api.get(url);
    return res.data;
};

/**
 * ADD a new shift for a weekday (reservation type=4)
 * funId=137
 */
export const addReservationShift = async ({
  rest_id,
  weekday,
  opening_unix,
  closing_unix,
  shift,
}) => {
    const url = `Tigger.php?funId=137&rest_id=${rest_id}&weekday=${weekday}&opening_time=${opening_unix}&closing_time=${closing_unix}&shift=${shift}&type=4`;
    console.log('addReservationShift url', url);
    const res = await api.get(url);
    return res.data;
};


export const addBranch = async ({ parent_restaurant_id, username, password }) => {
  const url = `Tigger.php?funId=84&parent_restaurant_id=${parent_restaurant_id}&username=${encodeURIComponent(
    username
  )}&password=${encodeURIComponent(password)}`;
  console.log('add branch url', url);
  const response = await api.get(url);
  return response.data;
};

