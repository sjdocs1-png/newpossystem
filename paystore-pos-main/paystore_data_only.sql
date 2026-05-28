--
-- PostgreSQL database dump
--

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.9

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'SQL_ASCII';
SET standard_conforming_strings = off;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET escape_string_warning = off;
SET row_security = off;

--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.customers (id, business_name, owner_email, owner_name, phone, address, subscription_plan, subscription_start, subscription_end, is_active, created_at, updated_at, max_stores, approval_status, approved_at, approved_by, ref_code, subscription_tier, business_type, enabled_addons, staff_limit, outlet_limit) FROM stdin;
1f309c22-eb0a-4786-984a-091857f72689	Golden Desserts & More	soihal@gmail.com	SOHAIL	9959177568	\N	yearly	2026-05-03	2026-06-02	t	2026-05-03 17:25:13.622669+00	2026-05-03 17:25:19.298262+00	4	approved	2026-05-03 17:25:19.189+00	cd638a8c-1d78-4d73-a417-9f2c4d57899a	CUS39731	platinum	restaurant	{}	2	1
\.


--
-- Data for Name: stores; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.stores (id, customer_id, store_name, address, phone, latitude, longitude, is_active, created_at, updated_at, store_code, password, business_type, country, currency_code, tax_type, tax_percentage, ref_code) FROM stdin;
b2e79446-68ff-4f86-89e4-9e0def4e5072	1f309c22-eb0a-4786-984a-091857f72689	Golden Desserts & More	Shop No 41 Grace Plaza Opp Sabri Masjid S.V. Road Jogeshwari West Mumbai-400102	9959177568	19.10480000	72.87240000	t	2026-05-03 17:36:45.774995+00	2026-05-08 02:05:34.526024+00	99061369	$2a$10$5gc..jfnr29u9LfrnSYyoujEvCYnfHD92JdeIycXlK8pI8qo.xsCy	restaurant	India	INR	GST	0	STR98324
\.


--
-- Data for Name: advance_requests; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.advance_requests (id, store_id, staff_id, staff_name, amount, reason, status, approved_by, approved_at, paid_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: bill_counters; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.bill_counters (id, store_id, counter_date, bill_counter, kot_counter, updated_at) FROM stdin;
84afdbe2-19af-414b-b8df-b690201d5495	b2e79446-68ff-4f86-89e4-9e0def4e5072	2026-05-03	1	0	2026-05-03 20:15:53.412521+00
2ef8dbc1-ea97-4dcd-b40e-3eb995dcd0ed	b2e79446-68ff-4f86-89e4-9e0def4e5072	2026-05-04	6	0	2026-05-04 16:32:59.586472+00
a7d5c884-1f7a-4178-86f3-bba21881ce42	b2e79446-68ff-4f86-89e4-9e0def4e5072	2026-05-05	10	0	2026-05-05 19:49:34.946664+00
b5c43f2f-fc7b-4919-a8fa-0fb6128a701e	b2e79446-68ff-4f86-89e4-9e0def4e5072	2026-05-07	1	0	2026-05-07 21:08:28.767816+00
\.


--
-- Data for Name: chat_conversations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.chat_conversations (id, name, type, store_id, customer_id, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: chat_messages; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.chat_messages (id, conversation_id, sender_id, sender_name, sender_role, content, message_type, media_url, media_type, is_read, created_at) FROM stdin;
\.


--
-- Data for Name: chat_participants; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.chat_participants (id, conversation_id, user_id, user_name, user_role, joined_at, last_read_at) FROM stdin;
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.orders (id, store_id, bill_number, order_type, table_number, customer_name, customer_phone, customer_address, items, subtotal, tax, discount, delivery_charge, container_charge, tip, total, payment_method, payment_details, status, cancelled_at, cancelled_by, cancel_reason, created_at, updated_at) FROM stdin;
579202ca-2c85-418e-a4df-ac683e3cda25	b2e79446-68ff-4f86-89e4-9e0def4e5072	QR-1072	qr	\N	sfdfd	9699999999	\N	[{"name": "Golden Special (Regular)", "price": 250, "category": "waffles", "quantity": 5}]	1250	0	0	0	0	0	1250	cash	\N	completed	\N	\N	\N	2026-05-04 01:30:07.625+00	2026-05-12 02:26:25.496919+00
6fe3e1a4-4e54-4f4e-acfe-2e35c8a06863	b2e79446-68ff-4f86-89e4-9e0def4e5072	B2605040004	dine-in	\N	\N	\N	\N	[{"id": "67064361-8ecf-4ea4-928d-b736022a6fff", "sku": "230", "name": "Kunafa Pistachio (Regular)", "price": 230, "barcode": null, "category": "waffles", "quantity": 3, "variations": [{"id": "085fa551-8630-48d0-9c2f-3093438a6a9b", "sku": "230", "name": "Regular", "unit": "pcs", "price": 230, "sortOrder": 0, "menuItemId": "67064361-8ecf-4ea4-928d-b736022a6fff", "isAvailable": true}], "ingredients": [], "isAvailable": true, "preparationTime": 10}]	690	35	0	0	0	0	725	cash	\N	completed	\N	\N	\N	2026-05-04 14:54:00.269+00	2026-05-12 02:26:25.496919+00
c030d651-f60b-4c7a-9f74-d452a695df42	b2e79446-68ff-4f86-89e4-9e0def4e5072	QR-6912	qr	\N	xvc	7788994455	\N	[{"name": "Golden Special (Regular)", "price": 250, "category": "waffles", "quantity": 1}, {"name": "Kunafa Pistachio (Regular)", "price": 230, "category": "waffles", "quantity": 1}]	480	0	0	0	0	0	480	cash	\N	completed	\N	\N	\N	2026-05-04 01:34:36.121+00	2026-05-12 02:26:25.496919+00
6fe3e1a4-4e54-4f4e-abee-444fa3f23850	b2e79446-68ff-4f86-89e4-9e0def4e5072	B2605050007	dine-in	1	\N	\N	\N	[{"id": "8c9278b8-5455-47fe-a9ec-5cabdce83422", "sku": "250", "name": "Golden Special (Regular)", "price": 250, "barcode": null, "category": "waffles", "quantity": 1, "variations": [{"id": "680f0771-abd3-4f94-a859-bcabb2882368", "sku": "250", "name": "Regular", "unit": "pcs", "price": 250, "sortOrder": 0, "menuItemId": "8c9278b8-5455-47fe-a9ec-5cabdce83422", "isAvailable": true}], "ingredients": [], "isAvailable": true, "preparationTime": 10}, {"id": "67064361-8ecf-4ea4-928d-b736022a6fff", "sku": "230", "name": "Kunafa Pistachio (Regular)", "price": 230, "barcode": null, "category": "waffles", "quantity": 1, "variations": [{"id": "085fa551-8630-48d0-9c2f-3093438a6a9b", "sku": "230", "name": "Regular", "unit": "pcs", "price": 230, "sortOrder": 0, "menuItemId": "67064361-8ecf-4ea4-928d-b736022a6fff", "isAvailable": true}], "ingredients": [], "isAvailable": true, "preparationTime": 10}]	480	24	0	0	0	0	504	cash	\N	completed	\N	\N	\N	2026-05-05 04:02:56.693+00	2026-05-12 02:26:25.496919+00
6fe3e1a4-4e54-4f4e-ac02-72c67592da08	b2e79446-68ff-4f86-89e4-9e0def4e5072	B2605040006	dine-in	\N	\N	\N	\N	[{"id": "e5d3733b-c9a3-476c-9c01-4da24b59f330", "sku": "200", "name": "Lotus Biscoff (Regular)", "price": 200, "barcode": null, "category": "waffles", "quantity": 1, "variations": [{"id": "aad308f4-8b3a-4e76-81b5-8ddd8f6fbea2", "sku": "200", "name": "Regular", "unit": "pcs", "price": 200, "sortOrder": 0, "menuItemId": "e5d3733b-c9a3-476c-9c01-4da24b59f330", "isAvailable": true}], "ingredients": [], "isAvailable": true, "preparationTime": 10}]	200	10	0	0	0	0	210	card	\N	completed	\N	\N	\N	2026-05-04 16:33:01.888+00	2026-05-12 02:26:25.496919+00
6fe3e1a4-4e54-4f4e-abec-06e215f440ad	b2e79446-68ff-4f86-89e4-9e0def4e5072	B2605050006	delivery	\N	\N	\N	\N	[{"id": "e0782d1b-cb4a-4b6f-8b5d-27b20ed9618d", "sku": "180", "name": "Triple Chocolate (Regular)", "price": 180, "barcode": null, "category": "waffles", "quantity": 1, "variations": [{"id": "a80dcc70-e6ec-42d0-ae57-b16b482ed10b", "sku": "180", "name": "Regular", "unit": "pcs", "price": 180, "sortOrder": 0, "menuItemId": "e0782d1b-cb4a-4b6f-8b5d-27b20ed9618d", "isAvailable": true}], "ingredients": [], "isAvailable": true, "preparationTime": 10}]	180	9	0	0	0	0	189	upi	\N	completed	\N	\N	\N	2026-05-05 03:06:36.306+00	2026-05-12 02:26:25.496919+00
6fe3e1a4-4e54-4f4e-ac02-71e043881fb6	b2e79446-68ff-4f86-89e4-9e0def4e5072	B2605040005	dine-in	\N	\N	\N	\N	[{"id": "e0782d1b-cb4a-4b6f-8b5d-27b20ed9618d", "sku": "180", "name": "Triple Chocolate (Regular)", "price": 180, "barcode": null, "category": "waffles", "quantity": 1, "variations": [{"id": "a80dcc70-e6ec-42d0-ae57-b16b482ed10b", "sku": "180", "name": "Regular", "unit": "pcs", "price": 180, "sortOrder": 0, "menuItemId": "e0782d1b-cb4a-4b6f-8b5d-27b20ed9618d", "isAvailable": true}], "ingredients": [], "isAvailable": true, "preparationTime": 10}]	180	9	0	0	0	0	189	card	\N	completed	\N	\N	\N	2026-05-04 16:32:21.284+00	2026-05-12 02:26:25.496919+00
6fe3e1a4-4e54-4f4e-adeb-e35199f6c328	b2e79446-68ff-4f86-89e4-9e0def4e5072	B2605040001	dine-in	\N	\N	\N	\N	[{"id": "6913398a-3fe2-4a4a-b22e-fb52c89d7ece", "sku": "140", "name": "Belgian Milk (Regular)", "price": 140, "barcode": null, "category": "waffles", "quantity": 1, "variations": [{"id": "503cbe31-37f1-45db-ba41-0a14db365980", "sku": "140", "name": "Regular", "unit": "pcs", "price": 140, "sortOrder": 0, "menuItemId": "6913398a-3fe2-4a4a-b22e-fb52c89d7ece", "isAvailable": true}], "ingredients": [], "isAvailable": true, "preparationTime": 10}]	140	7	0	0	0	0	147	upi	\N	completed	\N	\N	\N	2026-05-04 03:43:34.236+00	2026-05-12 02:26:25.496919+00
6fe3e1a4-4e54-4f4e-abef-5bc3dc1c6b7c	b2e79446-68ff-4f86-89e4-9e0def4e5072	B2605050009	dine-in	\N	\N	\N	\N	[{"id": "8c9278b8-5455-47fe-a9ec-5cabdce83422", "sku": "250", "name": "Golden Special (Regular)", "price": 250, "barcode": null, "category": "waffles", "quantity": 1, "variations": [{"id": "680f0771-abd3-4f94-a859-bcabb2882368", "sku": "250", "name": "Regular", "unit": "pcs", "price": 250, "sortOrder": 0, "menuItemId": "8c9278b8-5455-47fe-a9ec-5cabdce83422", "isAvailable": true}], "ingredients": [], "isAvailable": true, "preparationTime": 10}, {"id": "67064361-8ecf-4ea4-928d-b736022a6fff", "sku": "230", "name": "Kunafa Pistachio (Regular)", "price": 230, "barcode": null, "category": "waffles", "quantity": 1, "variations": [{"id": "085fa551-8630-48d0-9c2f-3093438a6a9b", "sku": "230", "name": "Regular", "unit": "pcs", "price": 230, "sortOrder": 0, "menuItemId": "67064361-8ecf-4ea4-928d-b736022a6fff", "isAvailable": true}], "ingredients": [], "isAvailable": true, "preparationTime": 10}]	480	24	0	0	0	0	504	card	\N	completed	\N	\N	\N	2026-05-05 04:24:15.657+00	2026-05-12 02:26:25.496919+00
6fe3e1a4-4e54-4f4e-abeb-e6f4a8cfbe94	b2e79446-68ff-4f86-89e4-9e0def4e5072	B2605050003	dine-in	\N	\N	\N	\N	[{"id": "67064361-8ecf-4ea4-928d-b736022a6fff", "sku": "230", "name": "Kunafa Pistachio (Regular)", "price": 230, "barcode": null, "category": "waffles", "quantity": 1, "variations": [{"id": "085fa551-8630-48d0-9c2f-3093438a6a9b", "sku": "230", "name": "Regular", "unit": "pcs", "price": 230, "sortOrder": 0, "menuItemId": "67064361-8ecf-4ea4-928d-b736022a6fff", "isAvailable": true}], "ingredients": [], "isAvailable": true, "preparationTime": 10}]	230	12	0	0	0	0	242	cash	\N	completed	\N	\N	\N	2026-05-05 02:37:34.928+00	2026-05-12 02:26:25.496919+00
6fe3e1a4-4e54-4f4e-acfe-f7e693ffeea1	b2e79446-68ff-4f86-89e4-9e0def4e5072	B2605040003	takeaway	\N	\N	\N	\N	[{"id": "2976fadb-77b3-49e3-955b-49c81f0e603f", "sku": "220", "name": "Vintage (Regular)", "price": 220, "barcode": null, "category": "classic-coffee", "quantity": 1, "variations": [{"id": "a35cb272-1099-4590-82f8-a24a8f926478", "sku": "220", "name": "Regular", "unit": "pcs", "price": 220, "sortOrder": 0, "menuItemId": "2976fadb-77b3-49e3-955b-49c81f0e603f", "isAvailable": true}], "ingredients": [], "isAvailable": true, "preparationTime": 10}]	220	11	0	0	0	0	231	card	\N	completed	\N	\N	\N	2026-05-04 14:41:24.074+00	2026-05-12 02:26:25.496919+00
6fe3e1a4-4e54-4f4e-adb4-3a960d061b42	b2e79446-68ff-4f86-89e4-9e0def4e5072	B2605030001	takeaway	\N	\N	\N	\N	[{"id": "bbeb690a-22a5-4db3-89da-d420247d7d4e", "sku": null, "name": "Belgian", "price": 120, "barcode": null, "category": "pancakes", "quantity": 1, "variations": [], "ingredients": [], "isAvailable": true, "preparationTime": 10}]	120	6	0	0	0	0	126	cash	\N	completed	\N	\N	\N	2026-05-03 20:15:54.28+00	2026-05-12 02:26:25.496919+00
6fe3e1a4-4e54-4f4e-a892-0fcbe40b4232	b2e79446-68ff-4f86-89e4-9e0def4e5072	B2605070001	dine-in	\N	\N	\N	\N	[{"id": "2db55f72-9696-4e7f-962c-26c9e0865dfe", "sku": "170", "name": "Cookies & Cream (Regular)", "price": 170, "barcode": null, "category": "waffles", "quantity": 1, "variations": [{"id": "b6b929dc-ca0d-478d-b715-4b7022f207d7", "sku": "170", "name": "Regular", "unit": "pcs", "price": 170, "sortOrder": 0, "menuItemId": "2db55f72-9696-4e7f-962c-26c9e0865dfe", "isAvailable": true}], "ingredients": [], "isAvailable": true, "preparationTime": 10}]	170	9	0	0	0	0	179	card	\N	completed	\N	\N	\N	2026-05-07 21:08:28.848+00	2026-05-12 02:26:25.496919+00
6fe3e1a4-4e54-4f4e-abee-4570a2036b8f	b2e79446-68ff-4f86-89e4-9e0def4e5072	B2605050008	dine-in	1	\N	\N	\N	[{"id": "8c9278b8-5455-47fe-a9ec-5cabdce83422", "sku": "250", "name": "Golden Special (Regular)", "price": 250, "barcode": null, "category": "waffles", "quantity": 1, "variations": [{"id": "680f0771-abd3-4f94-a859-bcabb2882368", "sku": "250", "name": "Regular", "unit": "pcs", "price": 250, "sortOrder": 0, "menuItemId": "8c9278b8-5455-47fe-a9ec-5cabdce83422", "isAvailable": true}], "ingredients": [], "isAvailable": true, "preparationTime": 10}]	250	13	0	0	0	0	263	cash	\N	completed	\N	\N	\N	2026-05-05 04:03:10.886+00	2026-05-12 02:26:25.496919+00
6fe3e1a4-4e54-4f4e-abeb-e148b3e31ceb	b2e79446-68ff-4f86-89e4-9e0def4e5072	B2605050002	dine-in	\N	\N	\N	\N	[{"id": "dc0b62d2-10a7-47a7-964b-fd58e4034e59", "sku": "60", "name": "Mango (Regular)", "price": 60, "barcode": null, "category": "kulfi", "quantity": 2, "variations": [{"id": "a355f4a0-c00c-4efe-aaba-47156f6d7ad3", "sku": "60", "name": "Regular", "unit": "pcs", "price": 60, "sortOrder": 0, "menuItemId": "dc0b62d2-10a7-47a7-964b-fd58e4034e59", "isAvailable": true}], "ingredients": [], "isAvailable": true, "preparationTime": 10}]	120	6	0	0	0	0	126	cash	\N	completed	\N	\N	\N	2026-05-05 02:34:23.67+00	2026-05-12 02:26:25.496919+00
6fe3e1a4-4e54-4f4e-ac16-da697a39abc3	b2e79446-68ff-4f86-89e4-9e0def4e5072	B2605050001	dine-in	\N	\N	\N	\N	[{"id": "8c9278b8-5455-47fe-a9ec-5cabdce83422", "sku": "250", "name": "Golden Special (Regular)", "price": 250, "barcode": null, "category": "waffles", "quantity": 1, "variations": [{"id": "680f0771-abd3-4f94-a859-bcabb2882368", "sku": "250", "name": "Regular", "unit": "pcs", "price": 250, "sortOrder": 0, "menuItemId": "8c9278b8-5455-47fe-a9ec-5cabdce83422", "isAvailable": true}], "ingredients": [], "isAvailable": true, "preparationTime": 10}]	250	13	0	0	0	0	263	upi	\N	completed	\N	\N	\N	2026-05-05 01:49:20.848+00	2026-05-12 02:26:25.496919+00
6fe3e1a4-4e54-4f4e-acfe-f5edc673da12	b2e79446-68ff-4f86-89e4-9e0def4e5072	B2605040002	takeaway	\N	\N	\N	\N	[{"id": "2976fadb-77b3-49e3-955b-49c81f0e603f", "sku": "220", "name": "Vintage (Regular)", "price": 220, "barcode": null, "category": "classic-coffee", "quantity": 2, "variations": [{"id": "a35cb272-1099-4590-82f8-a24a8f926478", "sku": "220", "name": "Regular", "unit": "pcs", "price": 220, "sortOrder": 0, "menuItemId": "2976fadb-77b3-49e3-955b-49c81f0e603f", "isAvailable": true}], "ingredients": [], "isAvailable": true, "preparationTime": 10}]	440	22	0	0	0	0	462	cash	\N	completed	\N	\N	\N	2026-05-04 14:40:11.962+00	2026-05-12 02:26:25.496919+00
02330e37-9233-4ed6-a2d9-176208d3238b	b2e79446-68ff-4f86-89e4-9e0def4e5072	QR-1707	qr	\N	salman	7718862274	\N	[{"name": "Golden Special (Regular)", "price": 250, "category": "waffles", "quantity": 1}, {"name": "Kunafa Pistachio (Regular)", "price": 230, "category": "waffles", "quantity": 1}, {"name": "Triple Chocolate (Regular)", "price": 180, "category": "waffles", "quantity": 1}]	660	0	0	0	0	0	660	cash	\N	completed	\N	\N	\N	2026-05-04 01:30:57.702+00	2026-05-12 02:26:25.496919+00
6fe3e1a4-4e54-4f4e-aa0b-c169b7913bb7	b2e79446-68ff-4f86-89e4-9e0def4e5072	B2605050010	dine-in	\N	\N	\N	\N	[{"id": "8c9278b8-5455-47fe-a9ec-5cabdce83422", "sku": "250", "name": "Golden Special (Regular)", "price": 250, "barcode": null, "category": "waffles", "quantity": 1, "variations": [{"id": "680f0771-abd3-4f94-a859-bcabb2882368", "sku": "250", "name": "Regular", "unit": "pcs", "price": 250, "sortOrder": 0, "menuItemId": "8c9278b8-5455-47fe-a9ec-5cabdce83422", "isAvailable": true}], "ingredients": [], "isAvailable": true, "preparationTime": 10}]	250	13	0	0	0	0	263	cash	\N	completed	\N	\N	\N	2026-05-05 19:49:35.885+00	2026-05-12 02:26:25.496919+00
6fe3e1a4-4e54-4f4e-abec-c7b7070b3778	b2e79446-68ff-4f86-89e4-9e0def4e5072	B2605050005	dine-in	\N	\N	\N	\N	[{"id": "8c9278b8-5455-47fe-a9ec-5cabdce83422", "sku": "250", "name": "Golden Special (Regular)", "price": 250, "barcode": null, "category": "waffles", "quantity": 1, "variations": [{"id": "680f0771-abd3-4f94-a859-bcabb2882368", "sku": "250", "name": "Regular", "unit": "pcs", "price": 250, "sortOrder": 0, "menuItemId": "8c9278b8-5455-47fe-a9ec-5cabdce83422", "isAvailable": true}], "ingredients": [], "isAvailable": true, "preparationTime": 10}]	250	13	0	0	0	0	263	card	\N	completed	\N	\N	\N	2026-05-05 02:47:38.69+00	2026-05-12 02:26:25.496919+00
6fe3e1a4-4e54-4f4e-abeb-e6b2e1749361	b2e79446-68ff-4f86-89e4-9e0def4e5072	B2605050004	dine-in	\N	\N	\N	\N	[{"id": "8c9278b8-5455-47fe-a9ec-5cabdce83422", "sku": "250", "name": "Golden Special (Regular)", "price": 250, "barcode": null, "category": "waffles", "quantity": 1, "variations": [{"id": "680f0771-abd3-4f94-a859-bcabb2882368", "sku": "250", "name": "Regular", "unit": "pcs", "price": 250, "sortOrder": 0, "menuItemId": "8c9278b8-5455-47fe-a9ec-5cabdce83422", "isAvailable": true}], "ingredients": [], "isAvailable": true, "preparationTime": 10}]	250	13	0	0	0	0	263	card	\N	completed	\N	\N	\N	2026-05-05 02:38:10.613+00	2026-05-12 02:26:25.496919+00
\.


--
-- Data for Name: credit_ledger; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.credit_ledger (id, store_id, customer_name, customer_phone, order_id, bill_number, total_amount, paid_amount, due_amount, payment_status, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: credit_payments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.credit_payments (id, credit_id, store_id, amount, payment_method, received_by, notes, created_at) FROM stdin;
\.


--
-- Data for Name: delivery_assignments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.delivery_assignments (id, store_id, order_id, delivery_boy_name, delivery_boy_phone, status, assigned_at, picked_up_at, delivered_at, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: expenses; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.expenses (id, store_id, category, amount, description, date, paid_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: held_bills; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.held_bills (id, store_id, items, table_number, customer_name, held_at, created_at) FROM stdin;
\.


--
-- Data for Name: inventory_components; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.inventory_components (id, parent_inventory_id, child_inventory_id, quantity_required, unit, created_at) FROM stdin;
\.


--
-- Data for Name: inventory_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.inventory_items (id, store_id, name, quantity, unit, min_stock, cost_per_unit, cost_unit, production_yield, production_yield_unit, created_at, updated_at, barcode, batch_number, expiry_date, hsn_code, gst_percentage) FROM stdin;
mosvi88w0zz35iqho0p	b2e79446-68ff-4f86-89e4-9e0def4e5072	VANILA CAKE SPONGE	0	g	10000	0	kg	\N	\N	2026-05-05 17:00:26.083441+00	2026-05-12 02:26:25.173185+00	\N	\N	\N	\N	0
mosvi88wfcy6udtxuxc	b2e79446-68ff-4f86-89e4-9e0def4e5072	KIWI PULP	0	g	10000	0	kg	\N	\N	2026-05-05 17:00:26.083441+00	2026-05-12 02:26:25.173185+00	\N	\N	\N	\N	0
mosvi88whon66weu7k	b2e79446-68ff-4f86-89e4-9e0def4e5072	BROWNIE VANILA PREMIX	0	g	10000	0	kg	\N	\N	2026-05-05 17:00:26.083441+00	2026-05-12 02:26:25.173185+00	\N	\N	\N	\N	0
mosvi88wf96e21vr3n	b2e79446-68ff-4f86-89e4-9e0def4e5072	COCOA POWDER	0	g	10000	0	kg	\N	\N	2026-05-05 17:00:26.083441+00	2026-05-12 02:26:25.173185+00	\N	\N	\N	\N	0
mosvi88w460vmqt30vd	b2e79446-68ff-4f86-89e4-9e0def4e5072	COFFEE POWDER	0	g	10000	0	kg	\N	\N	2026-05-05 17:00:26.083441+00	2026-05-12 02:26:25.173185+00	\N	\N	\N	\N	0
mosvi88wmmgoabkb3h	b2e79446-68ff-4f86-89e4-9e0def4e5072	WHITE BATTER	0	g	10000	0	kg	\N	\N	2026-05-05 17:00:26.083441+00	2026-05-12 02:26:25.173185+00	\N	\N	\N	\N	0
mosvi88wp7geylzhnr	b2e79446-68ff-4f86-89e4-9e0def4e5072	TISSUE	0	g	10000	0	kg	\N	\N	2026-05-05 17:00:26.083441+00	2026-05-12 02:26:25.173185+00	\N	\N	\N	\N	0
mosvi88wy8jhr0nh12	b2e79446-68ff-4f86-89e4-9e0def4e5072	BROWN BAG SMALL	0	g	10000	0	kg	\N	\N	2026-05-05 17:00:26.083441+00	2026-05-12 02:26:25.173185+00	\N	\N	\N	\N	0
mosvi88wf05ai49hukj	b2e79446-68ff-4f86-89e4-9e0def4e5072	BROWN BAG BIG	0	g	10000	0	kg	\N	\N	2026-05-05 17:00:26.083441+00	2026-05-12 02:26:25.173185+00	\N	\N	\N	\N	0
mosvi88wvl4spxayr3a	b2e79446-68ff-4f86-89e4-9e0def4e5072	SHOTS GLASS	0	g	10000	0	kg	\N	\N	2026-05-05 17:00:26.083441+00	2026-05-12 02:26:25.173185+00	\N	\N	\N	\N	0
mosvi88w2bh3qxdjtkd	b2e79446-68ff-4f86-89e4-9e0def4e5072	PAPER CUP 100 ML	0	g	10000	0	kg	\N	\N	2026-05-05 17:00:26.083441+00	2026-05-12 02:26:25.173185+00	\N	\N	\N	\N	0
mosvi88westweqqy4x	b2e79446-68ff-4f86-89e4-9e0def4e5072	SHAKE GLASS	0	g	10000	0	kg	\N	\N	2026-05-05 17:00:26.083441+00	2026-05-12 02:26:25.173185+00	\N	\N	\N	\N	0
mosvi88w8gedbzktiz4	b2e79446-68ff-4f86-89e4-9e0def4e5072	GUN STICK	0	g	10000	0	kg	\N	\N	2026-05-05 17:00:26.083441+00	2026-05-12 02:26:25.173185+00	\N	\N	\N	\N	0
mosvi88vqq89kj8fmka	b2e79446-68ff-4f86-89e4-9e0def4e5072	MILK CHOCOLATE	0	g	10000	0	kg	\N	\N	2026-05-05 17:00:26.083441+00	2026-05-12 02:26:25.173185+00	\N	\N	\N	\N	0
mosvi88wt181klhcvxr	b2e79446-68ff-4f86-89e4-9e0def4e5072	DARK CHOCOLATE	0	g	10000	0	kg	\N	\N	2026-05-05 17:00:26.083441+00	2026-05-12 02:26:25.173185+00	\N	\N	\N	\N	0
mosvi88w8e55hgs241x	b2e79446-68ff-4f86-89e4-9e0def4e5072	WHITE CHOCOLATE	0	g	10000	0	kg	\N	\N	2026-05-05 17:00:26.083441+00	2026-05-12 02:26:25.173185+00	\N	\N	\N	\N	0
mosvi88way95f0yo7fi	b2e79446-68ff-4f86-89e4-9e0def4e5072	NUTELLA CHOCOLATE	0	g	10000	0	kg	\N	\N	2026-05-05 17:00:26.083441+00	2026-05-12 02:26:25.173185+00	\N	\N	\N	\N	0
mosvi88w5vrcjmbaib4	b2e79446-68ff-4f86-89e4-9e0def4e5072	ALMOND CHOCOLATE	0	g	10000	0	kg	\N	\N	2026-05-05 17:00:26.083441+00	2026-05-12 02:26:25.173185+00	\N	\N	\N	\N	0
mosvi88wyduuu87tb4	b2e79446-68ff-4f86-89e4-9e0def4e5072	BUTTERSCOTCH	0	g	10000	0	kg	\N	\N	2026-05-05 17:00:26.083441+00	2026-05-12 02:26:25.173185+00	\N	\N	\N	\N	0
mosvi88wcnk3m5szlyu	b2e79446-68ff-4f86-89e4-9e0def4e5072	COOKIES AND CREAM	0	g	10000	0	kg	\N	\N	2026-05-05 17:00:26.083441+00	2026-05-12 02:26:25.173185+00	\N	\N	\N	\N	0
mosvi88w43fv7zdgu4w	b2e79446-68ff-4f86-89e4-9e0def4e5072	BISCOFF SPREAD	0	g	10000	0	kg	\N	\N	2026-05-05 17:00:26.083441+00	2026-05-12 02:26:25.173185+00	\N	\N	\N	\N	0
mosvi88wp3nuyy5nq1	b2e79446-68ff-4f86-89e4-9e0def4e5072	KUNAFA PISTACHIO	0	g	10000	0	kg	\N	\N	2026-05-05 17:00:26.083441+00	2026-05-12 02:26:25.173185+00	\N	\N	\N	\N	0
mosvi88w0n6i62umdoia	b2e79446-68ff-4f86-89e4-9e0def4e5072	MAPLE SYRUP	0	g	10000	0	kg	\N	\N	2026-05-05 17:00:26.083441+00	2026-05-12 02:26:25.173185+00	\N	\N	\N	\N	0
mosvi88wybrzfztmi3l	b2e79446-68ff-4f86-89e4-9e0def4e5072	HONEY SYRUP	0	g	10000	0	kg	\N	\N	2026-05-05 17:00:26.083441+00	2026-05-12 02:26:25.173185+00	\N	\N	\N	\N	0
mosvi88w2zzwn1esfsc	b2e79446-68ff-4f86-89e4-9e0def4e5072	CHOCOLATE DRESSING	0	g	10000	0	kg	\N	\N	2026-05-05 17:00:26.083441+00	2026-05-12 02:26:25.173185+00	\N	\N	\N	\N	0
mosvi88wcvwffixpz4f	b2e79446-68ff-4f86-89e4-9e0def4e5072	VANILA ICE CREAM BULK	0	g	10000	0	kg	\N	\N	2026-05-05 17:00:26.083441+00	2026-05-12 02:26:25.173185+00	\N	\N	\N	\N	0
mosvi88whv41a8qr09	b2e79446-68ff-4f86-89e4-9e0def4e5072	CHOCOLATE ICE CREAM BULK	0	g	10000	0	kg	\N	\N	2026-05-05 17:00:26.083441+00	2026-05-12 02:26:25.173185+00	\N	\N	\N	\N	0
mosvi88wm7vjp479c9	b2e79446-68ff-4f86-89e4-9e0def4e5072	CHOCO CHIPS ICREAM BULK	0	g	10000	0	kg	\N	\N	2026-05-05 17:00:26.083441+00	2026-05-12 02:26:25.173185+00	\N	\N	\N	\N	0
mosvi88wcmqi2frt67q	b2e79446-68ff-4f86-89e4-9e0def4e5072	GUAVA PULP	0	g	10000	0	kg	\N	\N	2026-05-05 17:00:26.083441+00	2026-05-12 02:26:25.173185+00	\N	\N	\N	\N	0
mosvi88witax3tihvtn	b2e79446-68ff-4f86-89e4-9e0def4e5072	MANGO PULP	0	g	10000	0	kg	\N	\N	2026-05-05 17:00:26.083441+00	2026-05-12 02:26:25.173185+00	\N	\N	\N	\N	0
mosvi88wtuwn38s04w	b2e79446-68ff-4f86-89e4-9e0def4e5072	SITAFAL PULP	0	g	10000	0	kg	\N	\N	2026-05-05 17:00:26.083441+00	2026-05-12 02:26:25.173185+00	\N	\N	\N	\N	0
mosvi88wfuvdcczl20s	b2e79446-68ff-4f86-89e4-9e0def4e5072	MANGO CRUSH	0	g	10000	0	kg	\N	\N	2026-05-05 17:00:26.083441+00	2026-05-12 02:26:25.173185+00	\N	\N	\N	\N	0
mosvi88wczv4vac87sj	b2e79446-68ff-4f86-89e4-9e0def4e5072	GUAVA CRUSH	0	g	10000	0	kg	\N	\N	2026-05-05 17:00:26.083441+00	2026-05-12 02:26:25.173185+00	\N	\N	\N	\N	0
mosvi88w6herbwtk4fg	b2e79446-68ff-4f86-89e4-9e0def4e5072	KIWI CRUSH	0	g	10000	0	kg	\N	\N	2026-05-05 17:00:26.083441+00	2026-05-12 02:26:25.173185+00	\N	\N	\N	\N	0
mosvi88w6j0imhimoxy	b2e79446-68ff-4f86-89e4-9e0def4e5072	BLUEBERRY CRUSH	0	g	10000	0	kg	\N	\N	2026-05-05 17:00:26.083441+00	2026-05-12 02:26:25.173185+00	\N	\N	\N	\N	0
mosvi88w6pftdrh2tpe	b2e79446-68ff-4f86-89e4-9e0def4e5072	LITCHI CRUSH	0	g	10000	0	kg	\N	\N	2026-05-05 17:00:26.083441+00	2026-05-12 02:26:25.173185+00	\N	\N	\N	\N	0
mosvi88w8hwlfitglv9	b2e79446-68ff-4f86-89e4-9e0def4e5072	MANGO COMPOTE	0	g	10000	0	kg	\N	\N	2026-05-05 17:00:26.083441+00	2026-05-12 02:26:25.173185+00	\N	\N	\N	\N	0
mosvi88wi2sdsj5yb5l	b2e79446-68ff-4f86-89e4-9e0def4e5072	STRAWBERRY COMPOT	0	g	10000	0	kg	\N	\N	2026-05-05 17:00:26.083441+00	2026-05-12 02:26:25.173185+00	\N	\N	\N	\N	0
mosvi88wij6264e8b8g	b2e79446-68ff-4f86-89e4-9e0def4e5072	BLUBERRY COMPOTE	0	g	10000	0	kg	\N	\N	2026-05-05 17:00:26.083441+00	2026-05-12 02:26:25.173185+00	\N	\N	\N	\N	0
mosvi88wmkwwbyhscw	b2e79446-68ff-4f86-89e4-9e0def4e5072	WATER 500ML	0	g	10000	0	kg	\N	\N	2026-05-05 17:00:26.083441+00	2026-05-12 02:26:25.173185+00	\N	\N	\N	\N	0
mosvi88ww5za8v3fw1c	b2e79446-68ff-4f86-89e4-9e0def4e5072	WATER 1LTR	0	g	10000	0	kg	\N	\N	2026-05-05 17:00:26.083441+00	2026-05-12 02:26:25.173185+00	\N	\N	\N	\N	0
mosvi88wyl0iy5uya8f	b2e79446-68ff-4f86-89e4-9e0def4e5072	OIL	0	g	10000	0	kg	\N	\N	2026-05-05 17:00:26.083441+00	2026-05-12 02:26:25.173185+00	\N	\N	\N	\N	0
mosvi88w4alp6mxlhjf	b2e79446-68ff-4f86-89e4-9e0def4e5072	BROWNIE'S	0	g	10000	0	kg	\N	\N	2026-05-05 17:00:26.083441+00	2026-05-12 02:26:25.173185+00	\N	\N	\N	\N	0
mosvi88wjii9rcmaf0h	b2e79446-68ff-4f86-89e4-9e0def4e5072	COOKIES & CREAM ICE CREAM BULK	0	g	10000	0	kg	\N	\N	2026-05-05 17:00:26.083441+00	2026-05-12 02:26:25.173185+00	\N	\N	\N	\N	0
mosvi88w6fwtqr9ge7h	b2e79446-68ff-4f86-89e4-9e0def4e5072	BUTTERSCOTCH ICE CREAM BULK	0	g	10000	0	kg	\N	\N	2026-05-05 17:00:26.083441+00	2026-05-12 02:26:25.173185+00	\N	\N	\N	\N	0
mosvi88wohkeswmxt9s	b2e79446-68ff-4f86-89e4-9e0def4e5072	MANGO ICE CREAM BULK	0	g	10000	0	kg	\N	\N	2026-05-05 17:00:26.083441+00	2026-05-12 02:26:25.173185+00	\N	\N	\N	\N	0
mosvi88w9w3dcr9v5hp	b2e79446-68ff-4f86-89e4-9e0def4e5072	ALMOND CARNIVAL ICE CREAM BULK	0	g	10000	0	kg	\N	\N	2026-05-05 17:00:26.083441+00	2026-05-12 02:26:25.173185+00	\N	\N	\N	\N	0
mosvi88wn9tguq2gnw	b2e79446-68ff-4f86-89e4-9e0def4e5072	SITAFAL ICE CREAM BULK	0	g	10000	0	kg	\N	\N	2026-05-05 17:00:26.083441+00	2026-05-12 02:26:25.173185+00	\N	\N	\N	\N	0
mosvi88w6eewn8icbj6	b2e79446-68ff-4f86-89e4-9e0def4e5072	SALT	0	g	10000	0	kg	\N	\N	2026-05-05 17:00:26.083441+00	2026-05-12 02:26:25.173185+00	\N	\N	\N	\N	0
mosvi88wbzawjxiqwyo	b2e79446-68ff-4f86-89e4-9e0def4e5072	GLOVES	0	g	10000	0	kg	\N	\N	2026-05-05 17:00:26.083441+00	2026-05-12 02:26:25.173185+00	\N	\N	\N	\N	0
mosvi88wrsuurqsdlm	b2e79446-68ff-4f86-89e4-9e0def4e5072	GARBAGE BAG	0	g	10000	0	kg	\N	\N	2026-05-05 17:00:26.083441+00	2026-05-12 02:26:25.173185+00	\N	\N	\N	\N	0
mosvi88wtp3755dy3va	b2e79446-68ff-4f86-89e4-9e0def4e5072	TAPE	0	g	10000	0	kg	\N	\N	2026-05-05 17:00:26.083441+00	2026-05-12 02:26:25.173185+00	\N	\N	\N	\N	0
mosvi88wg9waukus45	b2e79446-68ff-4f86-89e4-9e0def4e5072	PIPEING BAG	0	g	10000	0	kg	\N	\N	2026-05-05 17:00:26.083441+00	2026-05-12 02:26:25.173185+00	\N	\N	\N	\N	0
mosvi88wmkxphprwp9i	b2e79446-68ff-4f86-89e4-9e0def4e5072	VIM GEL	0	g	10000	0	kg	\N	\N	2026-05-05 17:00:26.083441+00	2026-05-12 02:26:25.173185+00	\N	\N	\N	\N	0
mosvi88w8ius2lb2l3i	b2e79446-68ff-4f86-89e4-9e0def4e5072	STRAWBERRY PULP	0	g	10000	0	kg	\N	\N	2026-05-05 17:00:26.083441+00	2026-05-12 02:26:25.173185+00	\N	\N	\N	\N	0
mosvi88wzy7pp02m5ep	b2e79446-68ff-4f86-89e4-9e0def4e5072	WAFFLE PREMIX	0	g	10000	0	kg	\N	\N	2026-05-05 17:00:26.083441+00	2026-05-12 02:26:25.173185+00	\N	\N	\N	\N	0
mosvi88wixzvup8y8cd	b2e79446-68ff-4f86-89e4-9e0def4e5072	BROWNIE CHOCOLATE PREMIX	0	g	10000	0	kg	\N	\N	2026-05-05 17:00:26.083441+00	2026-05-12 02:26:25.173185+00	\N	\N	\N	\N	0
mosvi88w0xriqi2ha2bp	b2e79446-68ff-4f86-89e4-9e0def4e5072	WAFFLE BOX DOUBLE	0	g	10000	0	kg	\N	\N	2026-05-05 17:00:26.083441+00	2026-05-12 02:26:25.173185+00	\N	\N	\N	\N	0
mosvi88wkl4kk6v1na	b2e79446-68ff-4f86-89e4-9e0def4e5072	PANCAKE TRAY	0	g	10000	0	kg	\N	\N	2026-05-05 17:00:26.083441+00	2026-05-12 02:26:25.173185+00	\N	\N	\N	\N	0
mosvi88wl39wd6k1ekd	b2e79446-68ff-4f86-89e4-9e0def4e5072	BOWL 500ML	0	g	10000	0	kg	\N	\N	2026-05-05 17:00:26.083441+00	2026-05-12 02:26:25.173185+00	\N	\N	\N	\N	0
mosvi88w2ik5czqi8a6	b2e79446-68ff-4f86-89e4-9e0def4e5072	STRABERRY CRUSH	0	g	10000	0	kg	\N	\N	2026-05-05 17:00:26.083441+00	2026-05-12 02:26:25.173185+00	\N	\N	\N	\N	0
mosvi88wxouebyqgax	b2e79446-68ff-4f86-89e4-9e0def4e5072	MILK	0	g	10000	0	kg	\N	\N	2026-05-05 17:00:26.083441+00	2026-05-12 02:26:25.173185+00	\N	\N	\N	\N	0
mosvi88wx2qjk4iczal	b2e79446-68ff-4f86-89e4-9e0def4e5072	KITKAT	0	g	10000	0	kg	\N	\N	2026-05-05 17:00:26.083441+00	2026-05-12 02:26:25.173185+00	\N	\N	\N	\N	0
mosvi88wq1b44warzy	b2e79446-68ff-4f86-89e4-9e0def4e5072	OREO BISCIUTS	0	g	10000	0	kg	\N	\N	2026-05-05 17:00:26.083441+00	2026-05-12 02:26:25.173185+00	\N	\N	\N	\N	0
mosvi88wpayj5kflyc9	b2e79446-68ff-4f86-89e4-9e0def4e5072	BISCOFF BISCIUTS	0	g	10000	0	kg	\N	\N	2026-05-05 17:00:26.083441+00	2026-05-12 02:26:25.173185+00	\N	\N	\N	\N	0
mosvi88wefcc0sw7nhe	b2e79446-68ff-4f86-89e4-9e0def4e5072	FERRERO ROCHER	0	g	10000	0	kg	\N	\N	2026-05-05 17:00:26.083441+00	2026-05-12 02:26:25.173185+00	\N	\N	\N	\N	0
mosvi88wftuwfkvbgv4	b2e79446-68ff-4f86-89e4-9e0def4e5072	WHITE CHOCO CHIPS	0	g	10000	0	kg	\N	\N	2026-05-05 17:00:26.083441+00	2026-05-12 02:26:25.173185+00	\N	\N	\N	\N	0
mosvi88wzg1xh9rry0m	b2e79446-68ff-4f86-89e4-9e0def4e5072	DARK CHOCO CHIPS	0	g	10000	0	kg	\N	\N	2026-05-05 17:00:26.083441+00	2026-05-12 02:26:25.173185+00	\N	\N	\N	\N	0
mosvi88w8x4gglxrblj	b2e79446-68ff-4f86-89e4-9e0def4e5072	CHOCOLATE STICK	0	g	10000	0	kg	\N	\N	2026-05-05 17:00:26.083441+00	2026-05-12 02:26:25.173185+00	\N	\N	\N	\N	0
mosvi88whppo7ux40w9	b2e79446-68ff-4f86-89e4-9e0def4e5072	ICE CREAM CONE	0	g	10000	0	kg	\N	\N	2026-05-05 17:00:26.083441+00	2026-05-12 02:26:25.173185+00	\N	\N	\N	\N	0
mosvi88wto1fvhifmm	b2e79446-68ff-4f86-89e4-9e0def4e5072	WHIPE CREAM	0	g	10000	0	kg	\N	\N	2026-05-05 17:00:26.083441+00	2026-05-12 02:26:25.173185+00	\N	\N	\N	\N	0
mosvi88wzwwa3hgx2cb	b2e79446-68ff-4f86-89e4-9e0def4e5072	CHOCOLATE CAKE SPONGE	0	g	10000	0	kg	\N	\N	2026-05-05 17:00:26.083441+00	2026-05-12 02:26:25.173185+00	\N	\N	\N	\N	0
mosvi88wya4fm703xab	b2e79446-68ff-4f86-89e4-9e0def4e5072	DARK BETTER	0	g	10000	0	kg	\N	\N	2026-05-05 17:00:26.083441+00	2026-05-12 02:26:25.173185+00	\N	\N	\N	\N	0
mosvi88wly6pw5f2nv	b2e79446-68ff-4f86-89e4-9e0def4e5072	PACKAGING MATERIAL'S	0	g	10000	0	kg	\N	\N	2026-05-05 17:00:26.083441+00	2026-05-12 02:26:25.173185+00	\N	\N	\N	\N	0
mosvi88whxz6pj0pok9	b2e79446-68ff-4f86-89e4-9e0def4e5072	WAFFLE PAPER CONE	0	g	10000	0	kg	\N	\N	2026-05-05 17:00:26.083441+00	2026-05-12 02:26:25.173185+00	\N	\N	\N	\N	0
mosvi88we6dmqk90ku	b2e79446-68ff-4f86-89e4-9e0def4e5072	STRAW	0	g	10000	0	kg	\N	\N	2026-05-05 17:00:26.083441+00	2026-05-12 02:26:25.173185+00	\N	\N	\N	\N	0
mosvi88wxo937t35fd9	b2e79446-68ff-4f86-89e4-9e0def4e5072	SPOON	0	g	10000	0	kg	\N	\N	2026-05-05 17:00:26.083441+00	2026-05-12 02:26:25.173185+00	\N	\N	\N	\N	0
mosvi88w66j8yk76qub	b2e79446-68ff-4f86-89e4-9e0def4e5072	FORK	0	g	10000	0	kg	\N	\N	2026-05-05 17:00:26.083441+00	2026-05-12 02:26:25.173185+00	\N	\N	\N	\N	0
mosvi88wvb7o4pcmyjp	b2e79446-68ff-4f86-89e4-9e0def4e5072	LITCHI PULP	0	g	10000	0	kg	\N	\N	2026-05-05 17:00:26.083441+00	2026-05-12 02:26:25.173185+00	\N	\N	\N	\N	0
mosvi88w16kzkwdokaxj	b2e79446-68ff-4f86-89e4-9e0def4e5072	AMERICAN NUTS ICE CREAM BULK	0	g	10000	0	kg	\N	\N	2026-05-05 17:00:26.083441+00	2026-05-12 02:26:25.173185+00	\N	\N	\N	\N	0
mosvi88wp81gtrehv1e	b2e79446-68ff-4f86-89e4-9e0def4e5072	RED CHILLI	0	g	10000	0	kg	\N	\N	2026-05-05 17:00:26.083441+00	2026-05-12 02:26:25.173185+00	\N	\N	\N	\N	0
mosvi88wyogptyt0i7	b2e79446-68ff-4f86-89e4-9e0def4e5072	SUGAR	0	g	10000	0	kg	\N	\N	2026-05-05 17:00:26.083441+00	2026-05-12 02:26:25.173185+00	\N	\N	\N	\N	0
mosvi88w7p0px8vlrjm	b2e79446-68ff-4f86-89e4-9e0def4e5072	JAMUN PULP	0	g	10000	0	kg	\N	\N	2026-05-05 17:00:26.083441+00	2026-05-12 02:26:25.173185+00	\N	\N	\N	\N	0
mosvi88wh6ml78pk536	b2e79446-68ff-4f86-89e4-9e0def4e5072	WAFFLE BOX SINGLE	0	g	10000	0	kg	\N	\N	2026-05-05 17:00:26.083441+00	2026-05-12 02:26:25.173185+00	\N	\N	\N	\N	0
mosvi88wasxkkayjd1	b2e79446-68ff-4f86-89e4-9e0def4e5072	PANCAKE BOX	0	g	10000	0	kg	\N	\N	2026-05-05 17:00:26.083441+00	2026-05-12 02:26:25.173185+00	\N	\N	\N	\N	0
mosvi88wolzg7bq57pg	b2e79446-68ff-4f86-89e4-9e0def4e5072	TOOTH PICK	0	g	10000	0	kg	\N	\N	2026-05-05 17:00:26.083441+00	2026-05-12 02:26:25.173185+00	\N	\N	\N	\N	0
mosvi88wi70zaa2nfd	b2e79446-68ff-4f86-89e4-9e0def4e5072	SHOTS BOTTLE 250ML	0	g	10000	0	kg	\N	\N	2026-05-05 17:00:26.083441+00	2026-05-12 02:26:25.173185+00	\N	\N	\N	\N	0
mosvi88wphqs3uscp	b2e79446-68ff-4f86-89e4-9e0def4e5072	SQUEEZE BOTTLE	0	g	10000	0	kg	\N	\N	2026-05-05 17:00:26.083441+00	2026-05-12 02:26:25.173185+00	\N	\N	\N	\N	0
mosvi88wi9eeeg1fwe	b2e79446-68ff-4f86-89e4-9e0def4e5072	FOIL PAPER	0	g	10000	0	kg	\N	\N	2026-05-05 17:00:26.083441+00	2026-05-12 02:26:25.173185+00	\N	\N	\N	\N	0
\.


--
-- Data for Name: leave_requests; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.leave_requests (id, store_id, staff_id, staff_name, leave_type, start_date, end_date, reason, status, approved_by, approved_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: login_attempts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.login_attempts (id, identifier, attempt_type, attempt_time, success, ip_address) FROM stdin;
aeb53a8b-7ba2-470d-b1d7-b9244b1eb4f1	42010613	store	2026-02-15 21:55:13.461141+00	t	\N
7a120766-f2a2-4cab-850f-6d37b6589c9f	42010613	store	2026-02-26 00:10:40.171305+00	t	\N
8e336533-a8df-45d6-9415-d6febd154596	42010613	store	2026-02-26 00:12:12.191694+00	t	\N
409d96ca-b4da-4faa-9b88-6721e1321a0a	42010613	store	2026-02-26 02:23:31.741668+00	t	\N
6c0433ff-9a6f-4395-8df9-9e32a123fa08	42010613	store	2026-02-26 02:32:04.490324+00	t	\N
93d16236-02e3-41b4-aed0-f1277cc04064	43281694	staff	2026-02-27 00:47:41.794889+00	f	110.224.125.138
53c5a769-4f88-40c1-b695-e97e273fdae0	43281694	staff	2026-02-27 00:48:12.159629+00	f	110.224.125.138
453ca1ce-c0e4-49e0-ada4-bdc2d074a602	67479371	staff	2026-02-27 00:50:00.001032+00	t	110.224.125.138
a1487539-82cf-4da4-86b7-c12309c36b4f	72962743	store	2026-02-28 01:44:43.424729+00	f	\N
51386f17-f455-4686-b6b5-8a3dbe3e1bd3	72962743	store	2026-02-28 01:44:52.949813+00	f	\N
4bd0afd0-a242-465b-873e-6f92dd13c339	79482186	store	2026-02-28 01:46:17.768437+00	f	\N
e16adba7-c486-49fa-a861-280e181ab03b	92210407	store	2026-02-28 02:01:46.920036+00	f	\N
7a597520-8890-4b7f-a939-62e299069b8e	23167571	store	2026-02-28 02:04:29.742006+00	f	\N
50c56a98-0511-46c5-abac-e1cb338b6599	23167571	store	2026-02-28 02:06:51.158004+00	t	\N
8b3e744d-f9a8-47ff-a7e2-b4ba42e3b9a3	37682196	store	2026-03-03 02:34:02.599164+00	f	\N
db66bc9b-0e44-4f47-b400-7a7fda369816	37682196	store	2026-03-03 02:34:07.267357+00	f	\N
37868df6-a502-49c9-8cca-d8b8b2df141f	23167571	store	2026-03-03 02:34:49.135175+00	f	\N
2652a98e-1769-4478-89ca-fa675ad173bc	37682196	store	2026-03-03 02:35:22.321642+00	f	\N
bbe71870-6667-4976-9dce-b9485a640226	23167571	store	2026-03-03 02:37:10.071188+00	t	\N
722d707d-085f-4184-abf8-6eb3f9d31958	23167571	store	2026-03-03 02:38:18.075937+00	t	\N
061b1472-cad0-4712-bcc2-ead2b48e28d7	97130636	store	2026-03-24 20:35:34.784009+00	f	\N
4133c6c0-10ab-464d-8be2-96e53109b57d	97130636	staff	2026-03-24 20:35:38.344247+00	f	223.228.55.80
226e59b6-b080-456f-88e9-d3ac5701df2a	57848417	store	2026-03-25 03:58:00.803575+00	f	\N
dd2f2b32-7af9-49f9-a971-b490b707ee5a	57848417	staff	2026-03-25 03:58:02.370409+00	f	110.224.118.200
f3cbef82-b355-47ff-ac95-9f9050ca63b0	67060777	staff	2026-03-29 01:45:35.011736+00	f	34.178.18.184
\.


--
-- Data for Name: menu_item_ingredients; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.menu_item_ingredients (id, menu_item_id, inventory_item_id, quantity_required, unit, created_at) FROM stdin;
\.


--
-- Data for Name: menu_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.menu_items (id, store_id, name, name_hindi, price, category, is_available, stock, preparation_time, image_url, description, created_at, updated_at, linked_inventory_id, gramage_per_unit, sku, barcode) FROM stdin;
8c9278b8-5455-47fe-a9ec-5cabdce83422	b2e79446-68ff-4f86-89e4-9e0def4e5072	Golden Special	\N	250	waffles	t	\N	10	\N	\N	2026-05-03 17:48:32.159525+00	2026-05-03 17:48:32.159525+00	\N	0	\N	\N
67064361-8ecf-4ea4-928d-b736022a6fff	b2e79446-68ff-4f86-89e4-9e0def4e5072	Kunafa Pistachio	\N	230	waffles	t	\N	10	\N	\N	2026-05-03 17:48:32.159525+00	2026-05-03 17:48:32.159525+00	\N	0	\N	\N
e0782d1b-cb4a-4b6f-8b5d-27b20ed9618d	b2e79446-68ff-4f86-89e4-9e0def4e5072	Triple Chocolate	\N	180	waffles	t	\N	10	\N	\N	2026-05-03 17:48:32.159525+00	2026-05-03 17:48:32.159525+00	\N	0	\N	\N
e5d3733b-c9a3-476c-9c01-4da24b59f330	b2e79446-68ff-4f86-89e4-9e0def4e5072	Lotus Biscoff	\N	200	waffles	t	\N	10	\N	\N	2026-05-03 17:48:32.159525+00	2026-05-03 17:48:32.159525+00	\N	0	\N	\N
6913398a-3fe2-4a4a-b22e-fb52c89d7ece	b2e79446-68ff-4f86-89e4-9e0def4e5072	Belgian Milk	\N	140	waffles	t	\N	10	\N	\N	2026-05-03 17:48:32.159525+00	2026-05-03 17:48:32.159525+00	\N	0	\N	\N
644a1754-b86b-4be6-a71d-36cff9be4c63	b2e79446-68ff-4f86-89e4-9e0def4e5072	Belgian Dark	\N	140	waffles	t	\N	10	\N	\N	2026-05-03 17:48:32.159525+00	2026-05-03 17:48:32.159525+00	\N	0	\N	\N
6ea4daf9-5979-4d4a-bcc1-dc2005dc23bf	b2e79446-68ff-4f86-89e4-9e0def4e5072	Almond Affair	\N	170	waffles	t	\N	10	\N	\N	2026-05-03 17:48:32.159525+00	2026-05-03 17:48:32.159525+00	\N	0	\N	\N
0de42922-d65f-463e-b836-76b6b77568f3	b2e79446-68ff-4f86-89e4-9e0def4e5072	Butterscotch	\N	170	waffles	t	\N	10	\N	\N	2026-05-03 17:48:32.159525+00	2026-05-03 17:48:32.159525+00	\N	0	\N	\N
ddb9c01f-74a9-4d7f-8ff9-6a70b2f70886	b2e79446-68ff-4f86-89e4-9e0def4e5072	Naughty Nutella	\N	180	waffles	t	\N	10	\N	\N	2026-05-03 17:48:32.159525+00	2026-05-03 17:48:32.159525+00	\N	0	\N	\N
fec4830b-f652-4973-af55-670fe968c214	b2e79446-68ff-4f86-89e4-9e0def4e5072	KitKat Crunch	\N	170	waffles	t	\N	10	\N	\N	2026-05-03 17:48:32.159525+00	2026-05-03 17:48:32.159525+00	\N	0	\N	\N
2db55f72-9696-4e7f-962c-26c9e0865dfe	b2e79446-68ff-4f86-89e4-9e0def4e5072	Cookies & Cream	\N	170	waffles	t	\N	10	\N	\N	2026-05-03 17:48:32.159525+00	2026-05-03 17:48:32.159525+00	\N	0	\N	\N
c420f984-d588-4b0e-98ad-84034a48b2a2	b2e79446-68ff-4f86-89e4-9e0def4e5072	Blueberry	\N	180	waffles	t	\N	10	\N	\N	2026-05-03 17:48:32.159525+00	2026-05-03 17:48:32.159525+00	\N	0	\N	\N
fe5c9888-9fc2-4bc6-8a62-90b5b722a2d6	b2e79446-68ff-4f86-89e4-9e0def4e5072	Strawberry	\N	180	waffles	t	\N	10	\N	\N	2026-05-03 17:48:32.159525+00	2026-05-03 17:48:32.159525+00	\N	0	\N	\N
551d1710-b7d1-46a0-b26a-31df2e054cf4	b2e79446-68ff-4f86-89e4-9e0def4e5072	Mango	\N	180	waffles	t	\N	10	\N	\N	2026-05-03 17:48:32.159525+00	2026-05-03 17:48:32.159525+00	\N	0	\N	\N
6f4009b3-1b8b-4503-8b30-1f13e28fe0af	b2e79446-68ff-4f86-89e4-9e0def4e5072	Dark & White Fantasy	\N	170	waffles	t	\N	10	\N	\N	2026-05-03 17:48:32.159525+00	2026-05-03 17:48:32.159525+00	\N	0	\N	\N
53e1602d-838a-4e53-bea9-4bac23ce496b	b2e79446-68ff-4f86-89e4-9e0def4e5072	Overload	\N	160	waffles	t	\N	10	\N	\N	2026-05-03 17:48:32.159525+00	2026-05-03 17:48:32.159525+00	\N	0	\N	\N
dae1554b-d7cd-4ee8-bbf0-3a73dfe94c4b	b2e79446-68ff-4f86-89e4-9e0def4e5072	Cotton Candy	\N	160	waffles	t	\N	10	\N	\N	2026-05-03 17:48:32.159525+00	2026-05-03 17:48:32.159525+00	\N	0	\N	\N
40b7f499-cd6e-446b-81df-a5512654cc54	b2e79446-68ff-4f86-89e4-9e0def4e5072	Coffee Mocha	\N	220	waffles	t	\N	10	\N	\N	2026-05-03 17:48:32.159525+00	2026-05-03 17:48:32.159525+00	\N	0	\N	\N
9b3d9707-2307-4cf7-a6cb-26c85c29021e	b2e79446-68ff-4f86-89e4-9e0def4e5072	Maple Butter	\N	120	waffles	t	\N	10	\N	\N	2026-05-03 17:48:32.159525+00	2026-05-03 17:48:32.159525+00	\N	0	\N	\N
c451ffc3-3cca-4580-8fc2-2f6512259f90	b2e79446-68ff-4f86-89e4-9e0def4e5072	Black Forest	\N	300	bowl-cakes	t	\N	10	\N	\N	2026-05-03 17:48:32.159525+00	2026-05-03 17:48:32.159525+00	\N	0	\N	\N
3df458d0-c72a-4054-9363-90a7c1bbfbec	b2e79446-68ff-4f86-89e4-9e0def4e5072	Dutch Truffle	\N	450	bowl-cakes	t	\N	10	\N	\N	2026-05-03 17:48:32.159525+00	2026-05-03 17:48:32.159525+00	\N	0	\N	\N
01b214ec-ae6f-4026-aadb-763129168d06	b2e79446-68ff-4f86-89e4-9e0def4e5072	Kunafa Lotus	\N	450	bowl-cakes	t	\N	10	\N	\N	2026-05-03 17:48:32.159525+00	2026-05-03 17:48:32.159525+00	\N	0	\N	\N
93218c0e-fb2e-464a-947a-fd9f080dbdf5	b2e79446-68ff-4f86-89e4-9e0def4e5072	Ferrero Rocher	\N	350	bowl-cakes	t	\N	10	\N	\N	2026-05-03 17:48:32.159525+00	2026-05-03 17:48:32.159525+00	\N	0	\N	\N
b3762838-f345-422c-b230-65fd832b4213	b2e79446-68ff-4f86-89e4-9e0def4e5072	Mango	\N	350	bowl-cakes	t	\N	10	\N	\N	2026-05-03 17:48:32.159525+00	2026-05-03 17:48:32.159525+00	\N	0	\N	\N
09f6a18f-cd4c-455d-8d35-8daf5e4bdc51	b2e79446-68ff-4f86-89e4-9e0def4e5072	Triple Madness	\N	280	bowl-cakes	t	\N	10	\N	\N	2026-05-03 17:48:32.159525+00	2026-05-03 17:48:32.159525+00	\N	0	\N	\N
14272990-fdd3-433a-8d3c-3a9c27f92526	b2e79446-68ff-4f86-89e4-9e0def4e5072	Almond Fantasy	\N	300	bowl-cakes	t	\N	10	\N	\N	2026-05-03 17:48:32.159525+00	2026-05-03 17:48:32.159525+00	\N	0	\N	\N
15510f1d-b5b3-4204-8480-00586e114be5	b2e79446-68ff-4f86-89e4-9e0def4e5072	Butterscotch	\N	250	bowl-cakes	t	\N	10	\N	\N	2026-05-03 17:48:32.159525+00	2026-05-03 17:48:32.159525+00	\N	0	\N	\N
4bf4a140-b545-48de-92a1-9abec4158080	b2e79446-68ff-4f86-89e4-9e0def4e5072	Naughty Nutella	\N	280	bowl-cakes	t	\N	10	\N	\N	2026-05-03 17:48:32.159525+00	2026-05-03 17:48:32.159525+00	\N	0	\N	\N
c1f82a77-8d66-4edc-aa69-b424c7becedd	b2e79446-68ff-4f86-89e4-9e0def4e5072	KitKat Crunch	\N	250	bowl-cakes	t	\N	10	\N	\N	2026-05-03 17:48:32.159525+00	2026-05-03 17:48:32.159525+00	\N	0	\N	\N
b6a83f2f-3d83-4478-818d-9ade2fdff966	b2e79446-68ff-4f86-89e4-9e0def4e5072	Cookies & Cream	\N	250	bowl-cakes	t	\N	10	\N	\N	2026-05-03 17:48:32.159525+00	2026-05-03 17:48:32.159525+00	\N	0	\N	\N
ee6e7477-7d67-4062-b883-e3f788e84d87	b2e79446-68ff-4f86-89e4-9e0def4e5072	Blueberry	\N	280	bowl-cakes	t	\N	10	\N	\N	2026-05-03 17:48:32.159525+00	2026-05-03 17:48:32.159525+00	\N	0	\N	\N
dd6f52af-90d1-48a0-a049-fa504308e82d	b2e79446-68ff-4f86-89e4-9e0def4e5072	Strawberry	\N	280	bowl-cakes	t	\N	10	\N	\N	2026-05-03 17:48:32.159525+00	2026-05-03 17:48:32.159525+00	\N	0	\N	\N
2543deaa-71be-4b8a-9167-955f520dcff0	b2e79446-68ff-4f86-89e4-9e0def4e5072	Milky Mania	\N	220	bowl-cakes	t	\N	10	\N	\N	2026-05-03 17:48:32.159525+00	2026-05-03 17:48:32.159525+00	\N	0	\N	\N
78d5b8a3-ed2b-4a64-b0e0-563cc07abac1	b2e79446-68ff-4f86-89e4-9e0def4e5072	Dark Temptation	\N	240	bowl-cakes	t	\N	10	\N	\N	2026-05-03 17:48:32.159525+00	2026-05-03 17:48:32.159525+00	\N	0	\N	\N
53cba7bb-2517-41c9-882e-f223bdcb16d4	b2e79446-68ff-4f86-89e4-9e0def4e5072	Lotus Biscoff	\N	280	bowl-cakes	t	\N	10	\N	\N	2026-05-03 17:48:32.159525+00	2026-05-03 17:48:32.159525+00	\N	0	\N	\N
db9e8cfb-79d6-43e7-94de-d3fddeb213b9	b2e79446-68ff-4f86-89e4-9e0def4e5072	Kunafa Pistachio	\N	320	bowl-cakes	t	\N	10	\N	\N	2026-05-03 17:48:32.159525+00	2026-05-03 17:48:32.159525+00	\N	0	\N	\N
2976fadb-77b3-49e3-955b-49c81f0e603f	b2e79446-68ff-4f86-89e4-9e0def4e5072	Vintage	\N	220	classic-coffee	t	\N	10	\N	\N	2026-05-03 17:48:32.159525+00	2026-05-03 17:48:32.159525+00	\N	0	\N	\N
637fa9ee-b660-4678-8663-71fe1c1ca4de	b2e79446-68ff-4f86-89e4-9e0def4e5072	Bronze Frost	\N	250	classic-coffee	t	\N	10	\N	\N	2026-05-03 17:48:32.159525+00	2026-05-03 17:48:32.159525+00	\N	0	\N	\N
6a3b9967-0e32-430f-b152-4462ed2e5046	b2e79446-68ff-4f86-89e4-9e0def4e5072	Coffee Mocha	\N	180	classic-coffee	t	\N	10	\N	\N	2026-05-03 17:48:32.159525+00	2026-05-03 17:48:32.159525+00	\N	0	\N	\N
357a587e-f102-4293-aa1c-736181098c36	b2e79446-68ff-4f86-89e4-9e0def4e5072	Milky Way	\N	150	sundaes	t	\N	10	\N	\N	2026-05-03 17:48:32.159525+00	2026-05-03 17:48:32.159525+00	\N	0	\N	\N
0b72db04-4579-4f96-bfb1-0901f3583f4e	b2e79446-68ff-4f86-89e4-9e0def4e5072	Dark Tempting	\N	180	sundaes	t	\N	10	\N	\N	2026-05-03 17:48:32.159525+00	2026-05-03 17:48:32.159525+00	\N	0	\N	\N
8590183b-f545-4200-b71b-9f0268eee72b	b2e79446-68ff-4f86-89e4-9e0def4e5072	Almond Delight	\N	180	sundaes	t	\N	10	\N	\N	2026-05-03 17:48:32.159525+00	2026-05-03 17:48:32.159525+00	\N	0	\N	\N
215675e5-eb4c-44cf-974f-ea45d2b2691a	b2e79446-68ff-4f86-89e4-9e0def4e5072	Nutty Butterscotch	\N	180	sundaes	t	\N	10	\N	\N	2026-05-03 17:48:32.159525+00	2026-05-03 17:48:32.159525+00	\N	0	\N	\N
fd60f822-d626-4a28-88ab-6573f930aba9	b2e79446-68ff-4f86-89e4-9e0def4e5072	Coffee Buzz	\N	180	sundaes	t	\N	10	\N	\N	2026-05-03 17:48:32.159525+00	2026-05-03 17:48:32.159525+00	\N	0	\N	\N
4d9eaa05-8854-40b5-90d4-140cbcf8a010	b2e79446-68ff-4f86-89e4-9e0def4e5072	Crazy KitKat	\N	160	sundaes	t	\N	10	\N	\N	2026-05-03 17:48:32.159525+00	2026-05-03 17:48:32.159525+00	\N	0	\N	\N
de18c187-5eca-4ad7-abad-379c006829bc	b2e79446-68ff-4f86-89e4-9e0def4e5072	Choco Lovely	\N	200	sundaes	t	\N	10	\N	\N	2026-05-03 17:48:32.159525+00	2026-05-03 17:48:32.159525+00	\N	0	\N	\N
1eee357d-3efb-4043-b6f6-b04506ac076b	b2e79446-68ff-4f86-89e4-9e0def4e5072	Overload	\N	160	sundaes	t	\N	10	\N	\N	2026-05-03 17:48:32.159525+00	2026-05-03 17:48:32.159525+00	\N	0	\N	\N
9e93c591-7dca-4248-9ff3-41791491bdaf	b2e79446-68ff-4f86-89e4-9e0def4e5072	Dark & White Fantasy	\N	160	sundaes	t	\N	10	\N	\N	2026-05-03 17:48:32.159525+00	2026-05-03 17:48:32.159525+00	\N	0	\N	\N
b6437921-3164-42a0-bc61-7269a2644c99	b2e79446-68ff-4f86-89e4-9e0def4e5072	Cookies & Cream	\N	180	sundaes	t	\N	10	\N	\N	2026-05-03 17:48:32.159525+00	2026-05-03 17:48:32.159525+00	\N	0	\N	\N
d6eaf237-16f9-4595-ae64-22ed1b73aee6	b2e79446-68ff-4f86-89e4-9e0def4e5072	Triple Sundae	\N	200	sundaes	t	\N	10	\N	\N	2026-05-03 17:48:32.159525+00	2026-05-03 17:48:32.159525+00	\N	0	\N	\N
5751812c-141d-4b03-8240-d7c41d65f763	b2e79446-68ff-4f86-89e4-9e0def4e5072	Jamun	\N	100	fruit-shots	t	\N	10	\N	\N	2026-05-03 17:48:32.159525+00	2026-05-03 17:48:32.159525+00	\N	0	\N	\N
e7b58273-a8d9-4195-b51b-66858c17bc5a	b2e79446-68ff-4f86-89e4-9e0def4e5072	Guava	\N	100	fruit-shots	t	\N	10	\N	\N	2026-05-03 17:48:32.159525+00	2026-05-03 17:48:32.159525+00	\N	0	\N	\N
1cb1f5e1-e121-43c3-aa9f-c04c9af1e483	b2e79446-68ff-4f86-89e4-9e0def4e5072	Kiwi	\N	120	fruit-shots	t	\N	10	\N	\N	2026-05-03 17:48:32.159525+00	2026-05-03 17:48:32.159525+00	\N	0	\N	\N
be2f7634-567b-4ebb-88c6-4b2f5f3cd75c	b2e79446-68ff-4f86-89e4-9e0def4e5072	Mango	\N	120	fruit-shots	t	\N	10	\N	\N	2026-05-03 17:48:32.159525+00	2026-05-03 17:48:32.159525+00	\N	0	\N	\N
145bf746-1133-47d3-a396-c0e3e9f87abe	b2e79446-68ff-4f86-89e4-9e0def4e5072	Sitafal	\N	120	fruit-shots	t	\N	10	\N	\N	2026-05-03 17:48:32.159525+00	2026-05-03 17:48:32.159525+00	\N	0	\N	\N
650ed20d-5bc1-418f-b33e-bc224c7f230c	b2e79446-68ff-4f86-89e4-9e0def4e5072	Strawberry	\N	100	fruit-shots	t	\N	10	\N	\N	2026-05-03 17:48:32.159525+00	2026-05-03 17:48:32.159525+00	\N	0	\N	\N
7c9fd780-d8d0-429c-94b9-1c4aed7e2208	b2e79446-68ff-4f86-89e4-9e0def4e5072	Litchi	\N	120	fruit-shots	t	\N	10	\N	\N	2026-05-03 17:48:32.159525+00	2026-05-03 17:48:32.159525+00	\N	0	\N	\N
18112032-731b-468a-9bc4-9e34cc8fc6fb	b2e79446-68ff-4f86-89e4-9e0def4e5072	Choco Lovely	\N	180	pancakes	t	\N	10	\N	\N	2026-05-03 17:48:32.159525+00	2026-05-03 17:48:32.159525+00	\N	0	\N	\N
787940a4-978e-4ba8-89df-17468fa1ba33	b2e79446-68ff-4f86-89e4-9e0def4e5072	Kunafa Pistachio	\N	180	pancakes	t	\N	10	\N	\N	2026-05-03 17:48:32.159525+00	2026-05-03 17:48:32.159525+00	\N	0	\N	\N
70dd8e08-b5d5-41b5-8896-9ec7e553a4ba	b2e79446-68ff-4f86-89e4-9e0def4e5072	Triple Chocolate	\N	160	pancakes	t	\N	10	\N	\N	2026-05-03 17:48:32.159525+00	2026-05-03 17:48:32.159525+00	\N	0	\N	\N
50d485d6-4bc8-453f-af7c-e46267d407a1	b2e79446-68ff-4f86-89e4-9e0def4e5072	Lotus Biscoff	\N	180	pancakes	t	\N	10	\N	\N	2026-05-03 17:48:32.159525+00	2026-05-03 17:48:32.159525+00	\N	0	\N	\N
bbeb690a-22a5-4db3-89da-d420247d7d4e	b2e79446-68ff-4f86-89e4-9e0def4e5072	Belgian	\N	120	pancakes	t	\N	10	\N	\N	2026-05-03 17:48:32.159525+00	2026-05-03 17:48:32.159525+00	\N	0	\N	\N
044affbe-a196-4b8b-ab74-438fa0d9e619	b2e79446-68ff-4f86-89e4-9e0def4e5072	Almond Affair	\N	140	pancakes	t	\N	10	\N	\N	2026-05-03 17:48:32.159525+00	2026-05-03 17:48:32.159525+00	\N	0	\N	\N
1626192e-6dad-4134-85ba-cb1cdf8d82e6	b2e79446-68ff-4f86-89e4-9e0def4e5072	Butterscotch	\N	140	pancakes	t	\N	10	\N	\N	2026-05-03 17:48:32.159525+00	2026-05-03 17:48:32.159525+00	\N	0	\N	\N
4a4caf68-6a3b-4b6b-bd32-c52f7d812fc8	b2e79446-68ff-4f86-89e4-9e0def4e5072	Naughty Nutella	\N	160	pancakes	t	\N	10	\N	\N	2026-05-03 17:48:32.159525+00	2026-05-03 17:48:32.159525+00	\N	0	\N	\N
db21fbcb-d0ec-415f-9a52-ef21a9d2cb29	b2e79446-68ff-4f86-89e4-9e0def4e5072	KitKat Crunch	\N	150	pancakes	t	\N	10	\N	\N	2026-05-03 17:48:32.159525+00	2026-05-03 17:48:32.159525+00	\N	0	\N	\N
82661e74-d588-4a6f-add9-39027b2bd25c	b2e79446-68ff-4f86-89e4-9e0def4e5072	Cookies & Cream	\N	150	pancakes	t	\N	10	\N	\N	2026-05-03 17:48:32.159525+00	2026-05-03 17:48:32.159525+00	\N	0	\N	\N
330ddc1c-f093-4786-a886-458ceb867ba3	b2e79446-68ff-4f86-89e4-9e0def4e5072	Blueberry	\N	150	pancakes	t	\N	10	\N	\N	2026-05-03 17:48:32.159525+00	2026-05-03 17:48:32.159525+00	\N	0	\N	\N
dd4744af-2bc1-4afb-8170-cab5447c5394	b2e79446-68ff-4f86-89e4-9e0def4e5072	Strawberry	\N	150	pancakes	t	\N	10	\N	\N	2026-05-03 17:48:32.159525+00	2026-05-03 17:48:32.159525+00	\N	0	\N	\N
125576cb-1506-42b1-ac89-16000fe326ce	b2e79446-68ff-4f86-89e4-9e0def4e5072	Mango	\N	150	pancakes	t	\N	10	\N	\N	2026-05-03 17:48:32.159525+00	2026-05-03 17:48:32.159525+00	\N	0	\N	\N
c12e60c7-5229-41df-8401-d2c3e660fedc	b2e79446-68ff-4f86-89e4-9e0def4e5072	Dark & White Fantasy	\N	140	pancakes	t	\N	10	\N	\N	2026-05-03 17:48:32.159525+00	2026-05-03 17:48:32.159525+00	\N	0	\N	\N
3f3b1cc0-f27b-4a49-a328-c9f5b3d96ebd	b2e79446-68ff-4f86-89e4-9e0def4e5072	Overload	\N	140	pancakes	t	\N	10	\N	\N	2026-05-03 17:48:32.159525+00	2026-05-03 17:48:32.159525+00	\N	0	\N	\N
38d94169-3e36-4c41-aa2e-40bc5dda196f	b2e79446-68ff-4f86-89e4-9e0def4e5072	Cotton Candy	\N	140	pancakes	t	\N	10	\N	\N	2026-05-03 17:48:32.159525+00	2026-05-03 17:48:32.159525+00	\N	0	\N	\N
09aff2bb-62d2-4e86-a9b3-4d691d508f85	b2e79446-68ff-4f86-89e4-9e0def4e5072	Coffee Mocha	\N	120	pancakes	t	\N	10	\N	\N	2026-05-03 17:48:32.159525+00	2026-05-03 17:48:32.159525+00	\N	0	\N	\N
e5c628a9-d76f-426d-903d-2232a2fb44e0	b2e79446-68ff-4f86-89e4-9e0def4e5072	Maple Butter	\N	100	pancakes	t	\N	10	\N	\N	2026-05-03 17:48:32.159525+00	2026-05-03 17:48:32.159525+00	\N	0	\N	\N
e8232249-a834-4332-959e-83eb1f4725c5	b2e79446-68ff-4f86-89e4-9e0def4e5072	Honey Butter	\N	100	pancakes	t	\N	10	\N	\N	2026-05-03 17:48:32.159525+00	2026-05-03 17:48:32.159525+00	\N	0	\N	\N
bff7058d-eb39-4ce7-be0e-11276e4117bd	b2e79446-68ff-4f86-89e4-9e0def4e5072	Apple	\N	120	stuffed-fruit	t	\N	10	\N	\N	2026-05-03 17:48:32.159525+00	2026-05-03 17:48:32.159525+00	\N	0	\N	\N
858f57db-fd9f-4fb7-b3e0-3865f1886c29	b2e79446-68ff-4f86-89e4-9e0def4e5072	Guava	\N	130	stuffed-fruit	t	\N	10	\N	\N	2026-05-03 17:48:32.159525+00	2026-05-03 17:48:32.159525+00	\N	0	\N	\N
6252cce6-53f7-4201-9860-3988b1b6d8fe	b2e79446-68ff-4f86-89e4-9e0def4e5072	Orange	\N	130	stuffed-fruit	t	\N	10	\N	\N	2026-05-03 17:48:32.159525+00	2026-05-03 17:48:32.159525+00	\N	0	\N	\N
ffd94679-07d4-4874-b81e-884c285b74a3	b2e79446-68ff-4f86-89e4-9e0def4e5072	Mango	\N	150	stuffed-fruit	t	\N	10	\N	\N	2026-05-03 17:48:32.159525+00	2026-05-03 17:48:32.159525+00	\N	0	\N	\N
475f7c52-53f3-45b9-9b56-eb3e82963ba7	b2e79446-68ff-4f86-89e4-9e0def4e5072	Pineapple	\N	150	stuffed-fruit	t	\N	10	\N	\N	2026-05-03 17:48:32.159525+00	2026-05-03 17:48:32.159525+00	\N	0	\N	\N
429551eb-0225-46d3-b9b8-b8a856d5c3a2	b2e79446-68ff-4f86-89e4-9e0def4e5072	Muskmelon	\N	240	stuffed-fruit	t	\N	10	\N	\N	2026-05-03 17:48:32.159525+00	2026-05-03 17:48:32.159525+00	\N	0	\N	\N
912d8234-fb07-4141-ab40-1a5ee51aa531	b2e79446-68ff-4f86-89e4-9e0def4e5072	Watermelon	\N	150	stuffed-fruit	t	\N	10	\N	\N	2026-05-03 17:48:32.159525+00	2026-05-03 17:48:32.159525+00	\N	0	\N	\N
b3ec2b75-5b5d-40ee-ac6b-51f5ef2420b4	b2e79446-68ff-4f86-89e4-9e0def4e5072	Jamun	\N	60	kulfi	t	\N	10	\N	\N	2026-05-03 17:48:32.159525+00	2026-05-03 17:48:32.159525+00	\N	0	\N	\N
2af23798-2ed4-41a6-859e-a67982f440b9	b2e79446-68ff-4f86-89e4-9e0def4e5072	Guava	\N	60	kulfi	t	\N	10	\N	\N	2026-05-03 17:48:32.159525+00	2026-05-03 17:48:32.159525+00	\N	0	\N	\N
c89bc728-b486-46cf-a6d4-dce67e5ec42d	b2e79446-68ff-4f86-89e4-9e0def4e5072	Kiwi	\N	60	kulfi	t	\N	10	\N	\N	2026-05-03 17:48:32.159525+00	2026-05-03 17:48:32.159525+00	\N	0	\N	\N
dc0b62d2-10a7-47a7-964b-fd58e4034e59	b2e79446-68ff-4f86-89e4-9e0def4e5072	Mango	\N	60	kulfi	t	\N	10	\N	\N	2026-05-03 17:48:32.159525+00	2026-05-03 17:48:32.159525+00	\N	0	\N	\N
86ea5243-4d65-4023-ae7f-e2b9ffafb1f7	b2e79446-68ff-4f86-89e4-9e0def4e5072	Sitafal	\N	60	kulfi	t	\N	10	\N	\N	2026-05-03 17:48:32.159525+00	2026-05-03 17:48:32.159525+00	\N	0	\N	\N
28df3748-fa42-4748-bf5f-8bd5a0e5613f	b2e79446-68ff-4f86-89e4-9e0def4e5072	Strawberry	\N	60	kulfi	t	\N	10	\N	\N	2026-05-03 17:48:32.159525+00	2026-05-03 17:48:32.159525+00	\N	0	\N	\N
e3831a74-c08f-4769-87b9-31cbaf18849e	b2e79446-68ff-4f86-89e4-9e0def4e5072	Imli	\N	60	kulfi	t	\N	10	\N	\N	2026-05-03 17:48:32.159525+00	2026-05-03 17:48:32.159525+00	\N	0	\N	\N
50269435-5a0f-4b29-b313-40600d60437a	b2e79446-68ff-4f86-89e4-9e0def4e5072	Muskmelon	\N	60	kulfi	t	\N	10	\N	\N	2026-05-03 17:48:32.159525+00	2026-05-03 17:48:32.159525+00	\N	0	\N	\N
9d5f88d4-b838-48bd-8b5a-d32daf184f9a	b2e79446-68ff-4f86-89e4-9e0def4e5072	Coconut	\N	60	kulfi	t	\N	10	\N	\N	2026-05-03 17:48:32.159525+00	2026-05-03 17:48:32.159525+00	\N	0	\N	\N
85c40e00-ca3b-44d5-9295-c1b0b0eef30b	b2e79446-68ff-4f86-89e4-9e0def4e5072	Chocolate Shake	\N	180	milk-shakes	t	\N	10	\N	\N	2026-05-03 17:48:32.159525+00	2026-05-03 17:48:32.159525+00	\N	0	\N	\N
9b6d8b7e-302d-4144-890d-159f0243fefe	b2e79446-68ff-4f86-89e4-9e0def4e5072	Berry Blast	\N	200	milk-shakes	t	\N	10	\N	\N	2026-05-03 17:48:32.159525+00	2026-05-03 17:48:32.159525+00	\N	0	\N	\N
98e489d0-577d-49ca-822d-7f43cce7839f	b2e79446-68ff-4f86-89e4-9e0def4e5072	Garden Strawberry	\N	180	milk-shakes	t	\N	10	\N	\N	2026-05-03 17:48:32.159525+00	2026-05-03 17:48:32.159525+00	\N	0	\N	\N
9646221e-5c4c-43c3-a6ca-30f786942a9b	b2e79446-68ff-4f86-89e4-9e0def4e5072	KitKat Shake	\N	200	milk-shakes	t	\N	10	\N	\N	2026-05-03 17:48:32.159525+00	2026-05-03 17:48:32.159525+00	\N	0	\N	\N
8f8b1f21-9b17-4557-a572-711b47d08ac0	b2e79446-68ff-4f86-89e4-9e0def4e5072	Ferrero Rocher	\N	250	milk-shakes	t	\N	10	\N	\N	2026-05-03 17:48:32.159525+00	2026-05-03 17:48:32.159525+00	\N	0	\N	\N
516aa2f2-3540-499a-a1d8-f6d7a3269d27	b2e79446-68ff-4f86-89e4-9e0def4e5072	Chocolate Brownie	\N	180	milk-shakes	t	\N	10	\N	\N	2026-05-03 17:48:32.159525+00	2026-05-03 17:48:32.159525+00	\N	0	\N	\N
e0b75168-696e-460b-a204-eb9412574f71	b2e79446-68ff-4f86-89e4-9e0def4e5072	Sitafal Shake	\N	220	milk-shakes	t	\N	10	\N	\N	2026-05-03 17:48:32.159525+00	2026-05-03 17:48:32.159525+00	\N	0	\N	\N
d5b9ed57-8bba-469d-80f8-b619d80619f7	b2e79446-68ff-4f86-89e4-9e0def4e5072	Naughty Nutella	\N	220	milk-shakes	t	\N	10	\N	\N	2026-05-03 17:48:32.159525+00	2026-05-03 17:48:32.159525+00	\N	0	\N	\N
26a8b60c-8292-481d-ae4b-50b38c832d96	b2e79446-68ff-4f86-89e4-9e0def4e5072	Mango Tres Leches	\N	250	tres-leches	t	\N	10	\N	\N	2026-05-03 17:48:32.159525+00	2026-05-03 17:48:32.159525+00	\N	0	\N	\N
74c7e199-9df3-4114-b519-c7120bd8edf0	b2e79446-68ff-4f86-89e4-9e0def4e5072	Blueberry Tres Leches	\N	250	tres-leches	t	\N	10	\N	\N	2026-05-03 17:48:32.159525+00	2026-05-03 17:48:32.159525+00	\N	0	\N	\N
\.


--
-- Data for Name: menu_item_variations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.menu_item_variations (id, menu_item_id, name, sku, price, is_available, stock, sort_order, created_at, unit) FROM stdin;
680f0771-abd3-4f94-a859-bcabb2882368	8c9278b8-5455-47fe-a9ec-5cabdce83422	Regular	250	250	t	\N	0	2026-05-03 17:48:32.943607+00	pcs
085fa551-8630-48d0-9c2f-3093438a6a9b	67064361-8ecf-4ea4-928d-b736022a6fff	Regular	230	230	t	\N	0	2026-05-03 17:48:33.307889+00	pcs
a80dcc70-e6ec-42d0-ae57-b16b482ed10b	e0782d1b-cb4a-4b6f-8b5d-27b20ed9618d	Regular	180	180	t	\N	0	2026-05-03 17:48:33.648947+00	pcs
aad308f4-8b3a-4e76-81b5-8ddd8f6fbea2	e5d3733b-c9a3-476c-9c01-4da24b59f330	Regular	200	200	t	\N	0	2026-05-03 17:48:33.970779+00	pcs
503cbe31-37f1-45db-ba41-0a14db365980	6913398a-3fe2-4a4a-b22e-fb52c89d7ece	Regular	140	140	t	\N	0	2026-05-03 17:48:34.29233+00	pcs
b9a4975e-f3e3-444e-9f0e-13196125b7b5	644a1754-b86b-4be6-a71d-36cff9be4c63	Regular	140	140	t	\N	0	2026-05-03 17:48:34.620143+00	pcs
1940aaaa-552f-4f1e-b1b3-8439a7d1b20d	6ea4daf9-5979-4d4a-bcc1-dc2005dc23bf	Regular	170	170	t	\N	0	2026-05-03 17:48:34.954687+00	pcs
283418eb-e3f7-4cba-99a1-2b483419d82c	0de42922-d65f-463e-b836-76b6b77568f3	Regular	170	170	t	\N	0	2026-05-03 17:48:35.291559+00	pcs
88be25f4-369f-40f9-863c-9fb61afdd382	ddb9c01f-74a9-4d7f-8ff9-6a70b2f70886	Regular	180	180	t	\N	0	2026-05-03 17:48:35.621153+00	pcs
ef402d1f-85b2-497a-8c77-1817a867fc9f	fec4830b-f652-4973-af55-670fe968c214	Regular	170	170	t	\N	0	2026-05-03 17:48:35.933068+00	pcs
b6b929dc-ca0d-478d-b715-4b7022f207d7	2db55f72-9696-4e7f-962c-26c9e0865dfe	Regular	170	170	t	\N	0	2026-05-03 17:48:36.529961+00	pcs
d110dc49-7001-410a-8794-0f01415d3f82	c420f984-d588-4b0e-98ad-84034a48b2a2	Regular	180	180	t	\N	0	2026-05-03 17:48:36.870519+00	pcs
e0a9c8a6-d236-430e-b306-d354fadf96ce	fe5c9888-9fc2-4bc6-8a62-90b5b722a2d6	Regular	180	180	t	\N	0	2026-05-03 17:48:37.192197+00	pcs
3bbcee2c-3448-4cae-84bb-466fca73615a	551d1710-b7d1-46a0-b26a-31df2e054cf4	Regular	180	180	t	\N	0	2026-05-03 17:48:37.521314+00	pcs
d8a66af9-7cb4-453a-ae67-c598ea784ec6	6f4009b3-1b8b-4503-8b30-1f13e28fe0af	Regular	170	170	t	\N	0	2026-05-03 17:48:37.849894+00	pcs
b63cd90b-628f-41a4-aeae-678018052e81	53e1602d-838a-4e53-bea9-4bac23ce496b	Milk	170	170	t	\N	0	2026-05-03 17:48:38.188741+00	pcs
db1309e6-d0ad-448c-b40e-a0c39bba0319	53e1602d-838a-4e53-bea9-4bac23ce496b	Dark	160	160	t	\N	1	2026-05-03 17:48:38.188741+00	pcs
dcbe0fee-1c7e-488c-9522-265f63d1e70c	dae1554b-d7cd-4ee8-bbf0-3a73dfe94c4b	Regular	160	160	t	\N	0	2026-05-03 17:48:38.519998+00	pcs
51314b58-93a2-437d-bb0c-196cddcc19e6	40b7f499-cd6e-446b-81df-a5512654cc54	Regular	220	220	t	\N	0	2026-05-03 17:48:38.839933+00	pcs
27e440f2-71e9-4883-80ce-7f3c3a6bb501	9b3d9707-2307-4cf7-a6cb-26c85c29021e	Regular	120	120	t	\N	0	2026-05-03 17:48:39.163645+00	pcs
c903b0f4-8423-494c-9481-0810b510bbfe	c451ffc3-3cca-4580-8fc2-2f6512259f90	Regular	300	300	t	\N	0	2026-05-03 17:48:39.490132+00	pcs
11361ced-8f76-44ef-ab6b-77000081e28c	3df458d0-c72a-4054-9363-90a7c1bbfbec	Regular	450	450	t	\N	0	2026-05-03 17:48:39.817024+00	pcs
06c12ddb-a909-4f4e-8984-c4c902faf30b	01b214ec-ae6f-4026-aadb-763129168d06	Regular	450	450	t	\N	0	2026-05-03 17:48:40.203006+00	pcs
4b6df1f5-a48d-4ae3-a58d-4db5ffeaa575	93218c0e-fb2e-464a-947a-fd9f080dbdf5	Regular	350	350	t	\N	0	2026-05-03 17:48:40.52182+00	pcs
1da2877d-cc11-4212-8f94-537e399748d7	b3762838-f345-422c-b230-65fd832b4213	Regular	350	350	t	\N	0	2026-05-03 17:48:40.827176+00	pcs
fe322c01-0f2c-4bec-92fc-9c0eeec1d644	09f6a18f-cd4c-455d-8d35-8daf5e4bdc51	Regular	280	280	t	\N	0	2026-05-03 17:48:41.15703+00	pcs
51a52e93-2dce-4a27-b9ca-7176267e60ab	14272990-fdd3-433a-8d3c-3a9c27f92526	Regular	300	300	t	\N	0	2026-05-03 17:48:41.480266+00	pcs
ff128743-c400-41b3-89a2-1b3f7b2ca8d1	15510f1d-b5b3-4204-8480-00586e114be5	Regular	250	250	t	\N	0	2026-05-03 17:48:41.818945+00	pcs
caa89991-078d-4e7d-bedc-a79b59fcd7d6	4bf4a140-b545-48de-92a1-9abec4158080	Regular	280	280	t	\N	0	2026-05-03 17:48:42.150723+00	pcs
88bea513-95a3-420f-ba17-85e1cc12291a	c1f82a77-8d66-4edc-aa69-b424c7becedd	Regular	250	250	t	\N	0	2026-05-03 17:48:42.480013+00	pcs
5aa53628-4b56-40e7-b5d7-dd8c10c5e785	b6a83f2f-3d83-4478-818d-9ade2fdff966	Regular	250	250	t	\N	0	2026-05-03 17:48:42.832855+00	pcs
191bc0d3-4231-4623-a75e-e68bcbb401b6	ee6e7477-7d67-4062-b883-e3f788e84d87	Regular	280	280	t	\N	0	2026-05-03 17:48:43.229056+00	pcs
bdd8d03d-d706-4458-a667-624b784b65df	dd6f52af-90d1-48a0-a049-fa504308e82d	Regular	280	280	t	\N	0	2026-05-03 17:48:43.561837+00	pcs
ae05d00d-411a-40d7-afa5-a83664c337d5	2543deaa-71be-4b8a-9167-955f520dcff0	Regular	220	220	t	\N	0	2026-05-03 17:48:43.891327+00	pcs
2f111142-5747-43ac-9b8d-95e60b7e1f0c	78d5b8a3-ed2b-4a64-b0e0-563cc07abac1	Regular	240	240	t	\N	0	2026-05-03 17:48:44.217737+00	pcs
bca650df-8976-40ac-a097-6eb7b2d1021c	53cba7bb-2517-41c9-882e-f223bdcb16d4	Regular	280	280	t	\N	0	2026-05-03 17:48:44.524955+00	pcs
1589add6-552c-4851-bee5-ec8bfba15052	db9e8cfb-79d6-43e7-94de-d3fddeb213b9	Regular	320	320	t	\N	0	2026-05-03 17:48:44.847365+00	pcs
a35cb272-1099-4590-82f8-a24a8f926478	2976fadb-77b3-49e3-955b-49c81f0e603f	Regular	220	220	t	\N	0	2026-05-03 17:48:45.169033+00	pcs
b39140aa-15d6-48dd-9cf4-0cf166226a92	637fa9ee-b660-4678-8663-71fe1c1ca4de	Regular	250	250	t	\N	0	2026-05-03 17:48:45.498532+00	pcs
fe55bade-e01c-4beb-acb4-d35fc63011b3	6a3b9967-0e32-430f-b152-4462ed2e5046	Regular	180	180	t	\N	0	2026-05-03 17:48:45.823654+00	pcs
bea29a8a-18f9-4859-bb80-7e88c08b7f9f	357a587e-f102-4293-aa1c-736181098c36	Regular	150	150	t	\N	0	2026-05-03 17:48:46.137481+00	pcs
e368fb8b-f184-41bf-b8cb-19b02e3a5558	0b72db04-4579-4f96-bfb1-0901f3583f4e	Regular	180	180	t	\N	0	2026-05-03 17:48:46.456836+00	pcs
e2f956dd-6c99-4438-a2fe-4d3cab9a340d	8590183b-f545-4200-b71b-9f0268eee72b	Regular	180	180	t	\N	0	2026-05-03 17:48:46.779754+00	pcs
59b3d7a4-cc0f-46fa-93da-241ea38b5bb9	215675e5-eb4c-44cf-974f-ea45d2b2691a	Regular	180	180	t	\N	0	2026-05-03 17:48:47.103844+00	pcs
b6132d19-10eb-4092-9df5-174c075fa33a	fd60f822-d626-4a28-88ab-6573f930aba9	Regular	180	180	t	\N	0	2026-05-03 17:48:47.441685+00	pcs
2c3b9647-bfcf-4351-81ff-a14d8074843c	4d9eaa05-8854-40b5-90d4-140cbcf8a010	Regular	160	160	t	\N	0	2026-05-03 17:48:47.757742+00	pcs
04b01651-073c-47fb-af0f-fa22d7ce43b5	de18c187-5eca-4ad7-abad-379c006829bc	Regular	200	200	t	\N	0	2026-05-03 17:48:48.068726+00	pcs
2c262594-f244-478a-a1fd-3d56c49661e3	9e93c591-7dca-4248-9ff3-41791491bdaf	Regular	160	160	t	\N	0	2026-05-03 17:48:48.718092+00	pcs
33b28c6a-be4a-4bab-b415-ac246b822933	b6437921-3164-42a0-bc61-7269a2644c99	Regular	180	180	t	\N	0	2026-05-03 17:48:49.050739+00	pcs
a1dfe2df-b7c6-4cea-b5a0-33cb1060d9b5	d6eaf237-16f9-4595-ae64-22ed1b73aee6	Regular	200	200	t	\N	0	2026-05-03 17:48:49.375238+00	pcs
86cc9327-7ea2-4073-b5d5-7f573272090c	5751812c-141d-4b03-8240-d7c41d65f763	2 Glass	100	100	t	\N	0	2026-05-03 17:48:49.68803+00	pcs
2808af72-e232-44c0-83d2-fe18076f859c	5751812c-141d-4b03-8240-d7c41d65f763	4 Glass	180	180	t	\N	1	2026-05-03 17:48:49.68803+00	pcs
d1fe90cc-128b-43fb-b6b6-0b78a6eddbcc	e7b58273-a8d9-4195-b51b-66858c17bc5a	2 Glass	100	100	t	\N	0	2026-05-03 17:48:49.998616+00	pcs
1d13bbf3-3768-4bc4-b03e-02de439f962f	e7b58273-a8d9-4195-b51b-66858c17bc5a	4 Glass	180	180	t	\N	1	2026-05-03 17:48:49.998616+00	pcs
fc69cccd-423f-4e42-8bb6-94863b7fb53c	1cb1f5e1-e121-43c3-aa9f-c04c9af1e483	2 Glass	120	120	t	\N	0	2026-05-03 17:48:50.331386+00	pcs
ceb92a8b-d972-4d8b-a076-39331d498d12	1cb1f5e1-e121-43c3-aa9f-c04c9af1e483	4 Glass	200	200	t	\N	1	2026-05-03 17:48:50.331386+00	pcs
871f9fa0-04f3-4b42-bd0c-7639e0ebc67c	be2f7634-567b-4ebb-88c6-4b2f5f3cd75c	2 Glass	120	120	t	\N	0	2026-05-03 17:48:50.661675+00	pcs
311a401e-5eac-4ef7-8286-88cbd1a39681	be2f7634-567b-4ebb-88c6-4b2f5f3cd75c	4 Glass	200	200	t	\N	1	2026-05-03 17:48:50.661675+00	pcs
783281b6-3bc0-4940-9358-ea999e57d793	145bf746-1133-47d3-a396-c0e3e9f87abe	2 Glass	120	120	t	\N	0	2026-05-03 17:48:50.993198+00	pcs
62e4136a-e1f2-4b0c-bb46-45a30928330f	145bf746-1133-47d3-a396-c0e3e9f87abe	4 Glass	200	200	t	\N	1	2026-05-03 17:48:50.993198+00	pcs
4a313f99-6037-4f27-bf5f-613bbb2a2d68	650ed20d-5bc1-418f-b33e-bc224c7f230c	2 Glass	100	100	t	\N	0	2026-05-03 17:48:51.307358+00	pcs
8b3cdf02-48a6-41bc-af82-a830a60e7002	650ed20d-5bc1-418f-b33e-bc224c7f230c	4 Glass	180	180	t	\N	1	2026-05-03 17:48:51.307358+00	pcs
386a4f1a-62da-45df-b9e0-92d985b76b17	7c9fd780-d8d0-429c-94b9-1c4aed7e2208	2 Glass	120	120	t	\N	0	2026-05-03 17:48:51.61231+00	pcs
bac63b41-86d6-42a1-9b92-661132c92e09	7c9fd780-d8d0-429c-94b9-1c4aed7e2208	4 Glass	200	200	t	\N	1	2026-05-03 17:48:51.61231+00	pcs
d11c94f2-7d12-4367-9f84-f295037b8b5d	18112032-731b-468a-9bc4-9e34cc8fc6fb	Regular	180	180	t	\N	0	2026-05-03 17:48:51.930297+00	pcs
ee75d146-932b-419c-bea9-e1d3e801a4d6	787940a4-978e-4ba8-89df-17468fa1ba33	Regular	180	180	t	\N	0	2026-05-03 17:48:52.251618+00	pcs
d6e4e5e7-2dfb-4a7a-9854-f93c1b00d245	70dd8e08-b5d5-41b5-8896-9ec7e553a4ba	Regular	160	160	t	\N	0	2026-05-03 17:48:52.580592+00	pcs
95e5ce6e-0ac2-45c7-8106-38de8e86ce58	50d485d6-4bc8-453f-af7c-e46267d407a1	Regular	180	180	t	\N	0	2026-05-03 17:48:52.901904+00	pcs
029df7c1-be68-4cb4-8cb8-16185020e215	044affbe-a196-4b8b-ab74-438fa0d9e619	Regular	140	140	t	\N	0	2026-05-03 17:48:53.539815+00	pcs
40dbb9bf-11db-4dd3-a051-bc0eb2e7df53	1626192e-6dad-4134-85ba-cb1cdf8d82e6	Regular	140	140	t	\N	0	2026-05-03 17:48:53.861487+00	pcs
e274fd89-a1a7-4da7-82ac-8356c5fe7a83	4a4caf68-6a3b-4b6b-bd32-c52f7d812fc8	Regular	160	160	t	\N	0	2026-05-03 17:48:54.183295+00	pcs
e4d7ebb9-2f82-4881-97e7-d9851fe68cc1	db21fbcb-d0ec-415f-9a52-ef21a9d2cb29	Regular	150	150	t	\N	0	2026-05-03 17:48:54.513889+00	pcs
369e73d1-b613-4268-bfe7-d32a0c469a96	330ddc1c-f093-4786-a886-458ceb867ba3	Regular	150	150	t	\N	0	2026-05-03 17:48:55.141405+00	pcs
4dc0d4f3-c213-472a-9dd5-4b4ab6a9cc91	125576cb-1506-42b1-ac89-16000fe326ce	Regular	150	150	t	\N	0	2026-05-03 17:48:55.776692+00	pcs
903ca0f1-44b5-4a42-8270-92588850e7ba	09aff2bb-62d2-4e86-a9b3-4d691d508f85	Regular	120	120	t	\N	0	2026-05-03 17:48:57.065142+00	pcs
d42c2103-069d-4544-9859-2f0c448fad31	e8232249-a834-4332-959e-83eb1f4725c5	Regular	100	100	t	\N	0	2026-05-03 17:48:57.710956+00	pcs
c5e8d6a5-6d8b-434c-b9cc-6d0176657688	858f57db-fd9f-4fb7-b3e0-3865f1886c29	Half	130	130	t	\N	0	2026-05-03 17:48:58.359732+00	pcs
23fcce96-c5f3-4caf-8ea6-76284c160f4a	858f57db-fd9f-4fb7-b3e0-3865f1886c29	Full	240	240	t	\N	1	2026-05-03 17:48:58.359732+00	pcs
d265aa48-b106-445d-93f2-c039f62604a7	ffd94679-07d4-4874-b81e-884c285b74a3	Half	150	150	t	\N	0	2026-05-03 17:48:58.986155+00	pcs
391b7ba7-a3e3-465d-820a-2bf205c5509c	ffd94679-07d4-4874-b81e-884c285b74a3	Full	300	300	t	\N	1	2026-05-03 17:48:58.986155+00	pcs
723aca96-ec1e-4bc4-8bb7-f324df161991	b3ec2b75-5b5d-40ee-ac6b-51f5ef2420b4	Regular	60	60	t	\N	0	2026-05-03 17:49:00.268526+00	pcs
2210a73b-8d97-4bd5-a6b1-f31d25d1fca7	c89bc728-b486-46cf-a6d4-dce67e5ec42d	Regular	60	60	t	\N	0	2026-05-03 17:49:00.996966+00	pcs
89cb3e35-7674-4d2c-847d-5227a4bbf32a	86ea5243-4d65-4023-ae7f-e2b9ffafb1f7	Regular	60	60	t	\N	0	2026-05-03 17:49:01.654463+00	pcs
1be4eaa1-e7f8-4003-ba2a-7940a141184a	e3831a74-c08f-4769-87b9-31cbaf18849e	Regular	60	60	t	\N	0	2026-05-03 17:49:02.272774+00	pcs
eb2fa67d-1497-4c6e-8631-93f6552e7a33	9d5f88d4-b838-48bd-8b5a-d32daf184f9a	Regular	60	60	t	\N	0	2026-05-03 17:49:02.92634+00	pcs
e104e8f9-7b89-42e8-8bb2-84a6058a57fd	9b6d8b7e-302d-4144-890d-159f0243fefe	Regular	200	200	t	\N	0	2026-05-03 17:49:03.605021+00	pcs
13aeb521-9a1d-4697-a04b-227488ac7ddc	9646221e-5c4c-43c3-a6ca-30f786942a9b	Regular	200	200	t	\N	0	2026-05-03 17:49:04.238075+00	pcs
292531a3-aa2c-46bd-9cf0-34ba3860a07e	516aa2f2-3540-499a-a1d8-f6d7a3269d27	Regular	180	180	t	\N	0	2026-05-03 17:49:04.890521+00	pcs
ab689be7-bfc6-4f3e-a7b1-bc14e6dde79f	d5b9ed57-8bba-469d-80f8-b619d80619f7	Regular	220	220	t	\N	0	2026-05-03 17:49:05.543943+00	pcs
42ed126d-5c25-4dbb-84b7-8a1db977ac1c	74c7e199-9df3-4114-b519-c7120bd8edf0	Regular	250	250	t	\N	0	2026-05-03 17:49:06.174661+00	pcs
99072361-db93-452c-b9c8-ec0d7012e24d	82661e74-d588-4a6f-add9-39027b2bd25c	Regular	150	150	t	\N	0	2026-05-03 17:48:54.830938+00	pcs
5a1676b6-d043-4e05-8a69-0741de71b410	dd4744af-2bc1-4afb-8170-cab5447c5394	Regular	150	150	t	\N	0	2026-05-03 17:48:55.456476+00	pcs
36775f1c-7d2b-4c7c-915a-babf34396575	c12e60c7-5229-41df-8401-d2c3e660fedc	Regular	140	140	t	\N	0	2026-05-03 17:48:56.109006+00	pcs
271491e4-74c4-4aae-aa40-4b95824524fd	38d94169-3e36-4c41-aa2e-40bc5dda196f	Regular	140	140	t	\N	0	2026-05-03 17:48:56.750286+00	pcs
bfac44d9-fb2d-41ad-91fd-51f14080ed1b	e5c628a9-d76f-426d-903d-2232a2fb44e0	Regular	100	100	t	\N	0	2026-05-03 17:48:57.390225+00	pcs
0e2e78f2-f2ec-4b3b-a00a-59eff5558a94	bff7058d-eb39-4ce7-be0e-11276e4117bd	Half	120	120	t	\N	0	2026-05-03 17:48:58.043568+00	pcs
bdc1b235-5667-4161-8364-4f11664544bc	bff7058d-eb39-4ce7-be0e-11276e4117bd	Full	220	220	t	\N	1	2026-05-03 17:48:58.043568+00	pcs
fe9d788a-0850-4645-8cb6-4912587a9674	6252cce6-53f7-4201-9860-3988b1b6d8fe	Half	130	130	t	\N	0	2026-05-03 17:48:58.662776+00	pcs
3934e2e5-5f84-4293-b4db-7823ba05ce96	6252cce6-53f7-4201-9860-3988b1b6d8fe	Full	240	240	t	\N	1	2026-05-03 17:48:58.662776+00	pcs
56757f56-486b-40a9-a6c7-ee7a3888a99d	475f7c52-53f3-45b9-9b56-eb3e82963ba7	Half	150	150	t	\N	0	2026-05-03 17:48:59.305441+00	pcs
aea48a0e-c325-4607-be8d-2968072299da	475f7c52-53f3-45b9-9b56-eb3e82963ba7	Full	300	300	t	\N	1	2026-05-03 17:48:59.305441+00	pcs
8ba4b3f5-a340-439a-adc0-38c745fe1ed7	912d8234-fb07-4141-ab40-1a5ee51aa531	Half	150	150	t	\N	0	2026-05-03 17:48:59.961925+00	pcs
92a79654-fd7d-4f19-96ef-1e0eece1ce7d	912d8234-fb07-4141-ab40-1a5ee51aa531	Full	300	300	t	\N	1	2026-05-03 17:48:59.961925+00	pcs
671320f4-09af-42db-8512-ea759e18900b	2af23798-2ed4-41a6-859e-a67982f440b9	Regular	60	60	t	\N	0	2026-05-03 17:49:00.57862+00	pcs
a355f4a0-c00c-4efe-aaba-47156f6d7ad3	dc0b62d2-10a7-47a7-964b-fd58e4034e59	Regular	60	60	t	\N	0	2026-05-03 17:49:01.319725+00	pcs
21d879e0-27f3-4f4b-8be6-433cd60e79f3	28df3748-fa42-4748-bf5f-8bd5a0e5613f	Regular	60	60	t	\N	0	2026-05-03 17:49:01.965336+00	pcs
ed8195cd-1d56-434b-a593-6db194b173a8	50269435-5a0f-4b29-b313-40600d60437a	Regular	60	60	t	\N	0	2026-05-03 17:49:02.599921+00	pcs
06138d2c-a644-4cc0-b3da-ca145fb2b0d1	85c40e00-ca3b-44d5-9295-c1b0b0eef30b	Regular	180	180	t	\N	0	2026-05-03 17:49:03.268429+00	pcs
c85b3e23-47b8-4450-bd0b-7a2e313fba2d	98e489d0-577d-49ca-822d-7f43cce7839f	Regular	180	180	t	\N	0	2026-05-03 17:49:03.918959+00	pcs
6aead6e9-dbeb-4c1e-b5dd-9193c2311d4f	8f8b1f21-9b17-4557-a572-711b47d08ac0	Regular	250	250	t	\N	0	2026-05-03 17:49:04.558209+00	pcs
ceeebbfa-3ee5-49de-9337-4de028271189	e0b75168-696e-460b-a204-eb9412574f71	Regular	220	220	t	\N	0	2026-05-03 17:49:05.226496+00	pcs
bf417d9a-b250-4323-ba40-ced9c2a49ad9	26a8b60c-8292-481d-ae4b-50b38c832d96	Regular	250	250	t	\N	0	2026-05-03 17:49:05.853557+00	pcs
\.


--
-- Data for Name: online_orders; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.online_orders (id, store_id, platform, platform_order_id, items, subtotal, tax, commission_amount, commission_percentage, delivery_charge, total, net_receivable, status, raw_payload, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payments (id, store_id, internal_order_id, payment_provider, provider_order_id, provider_payment_id, amount, currency, payment_mode, status, webhook_verified, business_date, expires_at, provider_data, error_message, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: payment_disputes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payment_disputes (id, store_id, payment_id, raised_by, reason, description, status, resolution, resolved_by, resolved_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: payment_settlements; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payment_settlements (id, store_id, settlement_id, amount, fee, tax, net_amount, payment_count, settlement_date, utr, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: pos_customers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.pos_customers (id, store_id, name, phone, email, address, city, state, pincode, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.profiles (id, email, full_name, phone, avatar_url, created_at, updated_at) FROM stdin;
e21f6868-86ce-4e16-a383-abdbf609967a	soihal@gmail.com	SOHAIL	\N	\N	2026-05-03 17:25:13.402167+00	2026-05-03 17:25:13.402167+00
da6b914e-8fff-4216-8ba9-0d7a35778c89	golden@gmail.com	Golden Desserts & More	9959177568	\N	2026-05-03 17:36:45.190338+00	2026-05-03 17:36:46.213312+00
fb98c9f0-ac48-42dd-a65b-a86274ef756b	salman@gmail.com	salman	\N	\N	2026-05-08 02:05:00.260454+00	2026-05-08 02:05:00.727361+00
f99f4847-b6fc-4d40-9a15-1ca8a7cceaf0	sohail@gmail.com	sohail khan 	\N	\N	2026-03-27 21:44:18.53064+00	2026-03-27 21:44:18.53064+00
412c98e4-67fe-4660-8a14-d42fa5c5c1ac	pos@gmail.com	Salman jagrala 	\N	\N	2026-04-01 03:29:51.638929+00	2026-04-01 03:29:51.638929+00
591dbe3a-556d-4813-b2e7-4f13fa431002	amin@gmail.com	Amim	\N	\N	2026-04-01 03:39:14.686799+00	2026-04-01 03:39:15.286034+00
d1fe1f44-b74a-40f8-b099-f380b692bcee	sa@gmail.com	salman	\N	\N	2026-04-01 04:03:55.102386+00	2026-04-01 04:03:56.452914+00
b70a7035-70f6-43c0-b053-c985544b3d2d	wasim@gmail.com	wasim	\N	\N	2026-04-05 10:00:06.787211+00	2026-04-05 10:00:06.787211+00
f26abde5-3238-4bdc-b8fd-7e5d8506d028	o@gmail.com	sohail	\N	\N	2026-04-08 21:14:36.340191+00	2026-04-08 21:14:36.340191+00
\.


--
-- Data for Name: purchase_recommendations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.purchase_recommendations (id, store_id, inventory_item_id, product_name, current_stock, min_stock, avg_daily_sales, predicted_demand_7d, suggested_quantity, reason, category, days_until_stockout, trend, status, generated_at, analysis_period_start, analysis_period_end, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: qr_orders; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.qr_orders (id, store_id, order_number, table_number, customer_name, customer_phone, items, subtotal, tax, total, status, notes, created_at, updated_at) FROM stdin;
23db0710-b420-4f38-bc3d-2a3882069ab2	b2e79446-68ff-4f86-89e4-9e0def4e5072	7792	\N	asdd	7718862274	[{"name": "Lotus Biscoff (Regular)", "price": 200, "category": "waffles", "quantity": 3}]	600	0	600	accepted	\N	2026-05-05 03:02:47.239964+00	2026-05-05 03:02:46.382+00
81d540df-927e-4daa-a283-60c586b073cc	b2e79446-68ff-4f86-89e4-9e0def4e5072	3343	\N	kljlkm	7894567899	[{"name": "Golden Special (Regular)", "price": 250, "category": "waffles", "quantity": 4}]	1000	0	1000	accepted	\N	2026-05-04 01:57:19.274411+00	2026-05-04 01:57:19.756+00
d5de9817-1c2f-480e-a5a8-27b627ffe1fb	b2e79446-68ff-4f86-89e4-9e0def4e5072	5337	\N	aaaa	7894561238	[{"name": "Golden Special (Regular)", "price": 250, "category": "waffles", "quantity": 3}]	750	0	750	accepted	\N	2026-05-04 02:08:58.611075+00	2026-05-04 02:08:59.261+00
e23d709b-bd50-4ecb-ad8d-0aace76b7190	b2e79446-68ff-4f86-89e4-9e0def4e5072	3826	\N	sfdf	7897897899	[{"name": "Golden Special (Regular)", "price": 250, "category": "waffles", "quantity": 2}]	500	0	500	accepted	\N	2026-05-04 02:18:12.845685+00	2026-05-04 02:18:13.525+00
546e833b-d48e-46d6-aa18-3cbbb195ec29	b2e79446-68ff-4f86-89e4-9e0def4e5072	6912	\N	xvc	7788994455	[{"name": "Golden Special (Regular)", "price": 250, "category": "waffles", "quantity": 1}, {"name": "Kunafa Pistachio (Regular)", "price": 230, "category": "waffles", "quantity": 1}]	480	0	480	completed	\N	2026-05-04 01:34:36.121275+00	2026-05-04 02:25:42.76+00
f2028dce-8e2d-4af7-b379-5bbc0150ecfd	b2e79446-68ff-4f86-89e4-9e0def4e5072	4611	\N	iouoi	7718862274	[{"name": "Golden Special (Regular)", "price": 250, "category": "waffles", "quantity": 3}]	750	0	750	accepted	\N	2026-05-04 02:36:17.278872+00	2026-05-04 02:36:18.125+00
8b64b7c2-e6ce-4e61-bfa5-d1f4ea2116ca	b2e79446-68ff-4f86-89e4-9e0def4e5072	5369	\N	ddd	7718862274	[{"name": "Golden Special (Regular)", "price": 250, "category": "waffles", "quantity": 1}]	250	0	250	accepted	\N	2026-05-04 02:42:41.982351+00	2026-05-04 02:42:42.515+00
439b8eb9-29ec-4e1a-aed3-a43cde7449cb	b2e79446-68ff-4f86-89e4-9e0def4e5072	9101	\N	fsdfsd	7718862274	[{"name": "Golden Special (Regular)", "price": 250, "category": "waffles", "quantity": 1}]	250	0	250	accepted	\N	2026-05-04 02:58:20.798881+00	2026-05-04 02:58:21.533+00
c7ce1e99-fb25-4ed6-91c9-8a5dcdb52bbc	b2e79446-68ff-4f86-89e4-9e0def4e5072	9551	\N	dvdfx	7718862274	[{"name": "Golden Special (Regular)", "price": 250, "category": "waffles", "quantity": 2}]	500	0	500	accepted	\N	2026-05-04 16:34:01.516464+00	2026-05-04 16:34:04.117+00
42cedf86-d2ae-4d97-8a01-768d62ecc46c	b2e79446-68ff-4f86-89e4-9e0def4e5072	1342	\N	sdfd	7718862274	[{"name": "Golden Special (Regular)", "price": 250, "category": "waffles", "quantity": 5}]	1250	0	1250	accepted	\N	2026-05-05 02:55:11.048667+00	2026-05-05 02:55:09.758+00
4f8e1503-1afc-447a-8de6-e116ba606031	b2e79446-68ff-4f86-89e4-9e0def4e5072	4464	\N	sdfsd	7788654234	[{"name": "Golden Special (Regular)", "price": 250, "category": "waffles", "quantity": 3}]	750	0	750	accepted	\N	2026-05-04 01:46:27.910777+00	2026-05-04 01:46:28.515+00
83769cfd-a6bf-4392-926f-73c79917a417	b2e79446-68ff-4f86-89e4-9e0def4e5072	2724	\N	hkh	7894564569	[{"name": "Choco Lovely (Regular)", "price": 180, "category": "pancakes", "quantity": 3}]	540	0	540	accepted	\N	2026-05-04 01:59:52.097803+00	2026-05-04 01:59:52.489+00
e4a03e6b-a0d5-49c6-8125-0a5a15764302	b2e79446-68ff-4f86-89e4-9e0def4e5072	3977	\N	wasdd	9519995684	[{"name": "Golden Special (Regular)", "price": 250, "category": "waffles", "quantity": 4}]	1000	0	1000	cancelled	\N	2026-05-04 01:15:54.019931+00	2026-05-04 01:29:34.819+00
b428e93a-1d22-4670-852d-ffe223a4b33e	b2e79446-68ff-4f86-89e4-9e0def4e5072	2980	\N	ASSA	9819995914	[{"name": "Golden Special (Regular)", "price": 250, "category": "waffles", "quantity": 3}]	750	0	750	cancelled	\N	2026-05-04 01:07:55.344087+00	2026-05-04 01:29:37.171+00
c83040c3-bb33-476c-8cf6-7f5466603079	b2e79446-68ff-4f86-89e4-9e0def4e5072	5004	\N	sdsa	7897897899	[{"name": "Golden Special (Regular)", "price": 250, "category": "waffles", "quantity": 1}]	250	0	250	accepted	\N	2026-05-04 02:12:29.827995+00	2026-05-04 02:12:30.303+00
dc32fbba-06f0-42b3-b41b-d128b78ba1e8	b2e79446-68ff-4f86-89e4-9e0def4e5072	3972	\N	oiukghk	7718862274	[{"name": "Golden Special (Regular)", "price": 250, "category": "waffles", "quantity": 2}]	500	0	500	accepted	\N	2026-05-04 02:24:11.995192+00	2026-05-04 02:24:12.657+00
58727ece-80d4-45da-8925-4a666b2e5602	b2e79446-68ff-4f86-89e4-9e0def4e5072	6477	\N	EWF	7718862274	[{"name": "Golden Special (Regular)", "price": 250, "category": "waffles", "quantity": 3}]	750	0	750	cancelled	\N	2026-05-04 00:51:54.685929+00	2026-05-04 01:02:50.903+00
850a10c2-d112-4cf4-b5cc-52e749766cd4	b2e79446-68ff-4f86-89e4-9e0def4e5072	2892	\N	OUOI	7718862274	[{"name": "Golden Special (Regular)", "price": 250, "category": "waffles", "quantity": 4}]	1000	0	1000	cancelled	\N	2026-05-04 01:03:33.014768+00	2026-05-04 01:03:55.687+00
8ffc30e9-590e-40d5-b063-46a668be6885	b2e79446-68ff-4f86-89e4-9e0def4e5072	1072	\N	sfdfd	9699999999	[{"name": "Golden Special (Regular)", "price": 250, "category": "waffles", "quantity": 5}]	1250	0	1250	completed	\N	2026-05-04 01:30:07.625657+00	2026-05-04 02:25:15.992+00
fba42c46-6735-42d7-bded-5506d5aa2f2e	b2e79446-68ff-4f86-89e4-9e0def4e5072	1707	\N	salman	7718862274	[{"name": "Golden Special (Regular)", "price": 250, "category": "waffles", "quantity": 1}, {"name": "Kunafa Pistachio (Regular)", "price": 230, "category": "waffles", "quantity": 1}, {"name": "Triple Chocolate (Regular)", "price": 180, "category": "waffles", "quantity": 1}]	660	0	660	completed	\N	2026-05-04 01:30:57.702673+00	2026-05-04 02:25:29.048+00
8603babc-3030-43b1-b3a7-e0d81f887c0f	b2e79446-68ff-4f86-89e4-9e0def4e5072	8194	\N	sdgdfg	7718862274	[{"name": "Golden Special (Regular)", "price": 250, "category": "waffles", "quantity": 3}]	750	0	750	accepted	\N	2026-05-04 02:38:42.004252+00	2026-05-04 02:38:42.736+00
2b72e68f-67dc-4ff4-ba6b-7720ba33dbe0	b2e79446-68ff-4f86-89e4-9e0def4e5072	2255	\N	fdgd	d7718865524	[{"name": "Golden Special (Regular)", "price": 250, "category": "waffles", "quantity": 3}]	750	0	750	cancelled	\N	2026-05-04 01:18:24.920486+00	2026-05-04 01:29:32.739+00
e394133d-d840-4c65-b259-b10b22f105db	b2e79446-68ff-4f86-89e4-9e0def4e5072	2103	\N	efgd	7718862274	[{"name": "Golden Special (Regular)", "price": 250, "category": "waffles", "quantity": 2}]	500	0	500	accepted	\N	2026-05-04 02:44:19.795843+00	2026-05-04 02:44:20.337+00
e79327ba-0b67-4248-a61a-6f742d875210	b2e79446-68ff-4f86-89e4-9e0def4e5072	8889	\N	sadsa	7718862274	[{"name": "Golden Special (Regular)", "price": 250, "category": "waffles", "quantity": 2}]	500	0	500	accepted	\N	2026-05-04 03:34:08.173737+00	2026-05-04 03:34:08.577+00
47125c1a-a730-4116-a000-0a940d271398	b2e79446-68ff-4f86-89e4-9e0def4e5072	1579	\N	fsf	7718862274	[{"name": "Golden Special (Regular)", "price": 250, "category": "waffles", "quantity": 2}]	500	0	500	accepted	\N	2026-05-05 01:39:42.140488+00	2026-05-05 01:39:40.683+00
26a78997-5d45-4fd9-a498-d6ba96b01b86	b2e79446-68ff-4f86-89e4-9e0def4e5072	5288	\N	salman	7718862274	[{"name": "Golden Special (Regular)", "price": 250, "category": "waffles", "quantity": 1}]	250	0	250	accepted	\N	2026-05-05 02:56:09.444686+00	2026-05-05 02:56:08.348+00
5e941f47-1c45-41dd-ab11-1619aa3d37f1	b2e79446-68ff-4f86-89e4-9e0def4e5072	6358	\N	kj,,kj	7718862274	[{"name": "Golden Special (Regular)", "price": 250, "category": "waffles", "quantity": 2}]	500	0	500	accepted	\N	2026-05-08 18:00:39.267651+00	2026-05-08 18:00:38.653+00
\.


--
-- Data for Name: security_audit_log; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.security_audit_log (id, user_id, action, table_name, record_id, old_data, new_data, ip_address, user_agent, created_at) FROM stdin;
\.


--
-- Data for Name: staff_attendance; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.staff_attendance (id, user_id, store_id, check_in_time, check_out_time, check_in_latitude, check_in_longitude, check_in_distance, check_out_latitude, check_out_longitude, check_out_distance, status, created_at, verification_method) FROM stdin;
\.


--
-- Data for Name: staff_notifications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.staff_notifications (id, store_id, staff_id, title, message, type, is_read, created_by, created_at) FROM stdin;
\.


--
-- Data for Name: staff_schedules; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.staff_schedules (id, store_id, staff_id, staff_name, date, shift, start_time, end_time, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: store_categories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.store_categories (id, store_id, category_id, name, name_hindi, icon, color, sort_order, created_at, updated_at) FROM stdin;
84f8eb7b-cf84-4f10-bf07-d59277d830b8	b2e79446-68ff-4f86-89e4-9e0def4e5072	waffles	Waffles	\N	📦	cat-food	0	2026-05-12 01:26:13.542475+00	2026-05-12 01:26:13.542475+00
14a4b797-7bf6-4876-93fd-9e58f2240cd7	b2e79446-68ff-4f86-89e4-9e0def4e5072	bowl-cakes	Bowl cakes	\N	📦	cat-food	1	2026-05-12 01:26:13.542475+00	2026-05-12 01:26:13.542475+00
a30600f5-0080-43a9-96be-44b6e645bb46	b2e79446-68ff-4f86-89e4-9e0def4e5072	classic-coffee	Classic coffee	\N	📦	cat-food	2	2026-05-12 01:26:13.542475+00	2026-05-12 01:26:13.542475+00
12db8e7c-36ee-4fac-9faf-5942354bca0d	b2e79446-68ff-4f86-89e4-9e0def4e5072	sundaes	Sundaes	\N	📦	cat-food	3	2026-05-12 01:26:13.542475+00	2026-05-12 01:26:13.542475+00
1aa66c97-66ea-41f5-aa39-2f8085065545	b2e79446-68ff-4f86-89e4-9e0def4e5072	fruit-shots	Fruit shots	\N	📦	cat-food	4	2026-05-12 01:26:13.542475+00	2026-05-12 01:26:13.542475+00
90e5b42f-1b9e-42c6-a446-632147a301c9	b2e79446-68ff-4f86-89e4-9e0def4e5072	pancakes	Pancakes	\N	📦	cat-food	5	2026-05-12 01:26:13.542475+00	2026-05-12 01:26:13.542475+00
1a879914-ea7e-4cd6-91a2-522d15ec22d7	b2e79446-68ff-4f86-89e4-9e0def4e5072	stuffed-fruit	Stuffed fruit	\N	📦	cat-food	6	2026-05-12 01:26:13.542475+00	2026-05-12 01:26:13.542475+00
21b90ac9-688e-4d89-8bbc-a10dd738a103	b2e79446-68ff-4f86-89e4-9e0def4e5072	kulfi	Kulfi	\N	📦	cat-food	7	2026-05-12 01:26:13.542475+00	2026-05-12 01:26:13.542475+00
0b8620cb-2eca-4dba-ab15-40afb135db17	b2e79446-68ff-4f86-89e4-9e0def4e5072	milk-shakes	Milk shakes	\N	📦	cat-food	8	2026-05-12 01:26:13.542475+00	2026-05-12 01:26:13.542475+00
48c90800-c6f1-49f7-b952-62af2e0f4d65	b2e79446-68ff-4f86-89e4-9e0def4e5072	tres-leches	Tres leches	\N	📦	cat-food	9	2026-05-12 01:26:13.542475+00	2026-05-12 01:26:13.542475+00
\.


--
-- Data for Name: store_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.store_settings (id, store_id, setting_key, setting_value, created_at, updated_at) FROM stdin;
782d1dd1-526d-44cd-a8fb-6e53e9a77523	b2e79446-68ff-4f86-89e4-9e0def4e5072	checklist_enable_system	true	2026-05-08 03:37:00.716087+00	2026-05-08 09:16:56.747648+00
9c647cff-f627-4975-bdaf-3dd9c2f7f814	b2e79446-68ff-4f86-89e4-9e0def4e5072	checklist_enable_closing_audit	true	2026-05-08 03:37:00.712152+00	2026-05-08 09:17:03.000493+00
32a31c27-7f58-46fe-ab60-5cadf04270f3	b2e79446-68ff-4f86-89e4-9e0def4e5072	pos_payment_sound_config	{"volume": 1, "enabled": true, "duration": 5, "soundType": "digital_beep", "repeatCount": 3, "retryInterval": 10}	2026-05-04 01:58:23.703491+00	2026-05-05 03:02:14.701721+00
ef34d857-2c1f-4bee-bc6d-76a3393a9f6c	b2e79446-68ff-4f86-89e4-9e0def4e5072	checklist_enable_weekly_deep_cleaning_audit	true	2026-05-08 03:37:00.712521+00	2026-05-08 09:17:03.148919+00
d683472c-fcb1-498f-b581-e64b85143e12	b2e79446-68ff-4f86-89e4-9e0def4e5072	checklist_enable_branch_audit	true	2026-05-08 03:37:00.741036+00	2026-05-08 09:17:03.300637+00
c021e270-ab7d-46a4-be5b-eb2918b60f40	b2e79446-68ff-4f86-89e4-9e0def4e5072	checklist_enable_ai_verification	true	2026-05-08 03:37:01.055294+00	2026-05-08 09:16:56.905146+00
f6a8aaea-f39d-4655-8a6e-7ea39f830228	b2e79446-68ff-4f86-89e4-9e0def4e5072	checklist_enable_inventory_audit	true	2026-05-08 03:37:01.004031+00	2026-05-08 09:17:03.449366+00
6c9aeecf-309c-4cce-8b67-60377ebc2af3	b2e79446-68ff-4f86-89e4-9e0def4e5072	pos_bill_config	{"email": "goldendesserts25@gmail.com", "fssai": "", "gstin": "", "phone": "9959177568", "upiId": "", "address": "Shop No 41 Grace Plaza Opp Sabri Masjid S.V. Road Jogeshwari West Mumbai-400102", "logoUrl": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAABQCAYAAACOEfKtAAAHIUlEQVR4AeyYC3IjOQ5E/eb+d951koIKZIHfqpJnYzXRMH6JBJhWux3zz3++/11S4J+f73+XFPgKeEm+n5+vgF8BLypwcfzPP4HA+wnAD4ztPfAvCP5EQDhEkgaQc8UzBhkPJDhkn5IPf/mYgMD703XnG4FEBzzCn8g7Xz4iINA5oWz9/lL207MSHWdAEjPu3lt9VEAYP6QWa/S8FTyM94/2jfqPCQg0d3sRmqDfBrQ5ftvpzwwXjHkS2caX2wUEmn997LEbd06NGL98PQDtu2rsSn6rgEC4Ww+Shc1BEWLOwVj6ORphgKi8XbtNQDg/VKLJVq8Dik8xlPksn3bLajxQl7bzWwSE80HR4TNXwpnL5qDdM0zko1tgj6vmvywgnA+JDq4XfzqPboLz7at3XRIQzgdEh64cpXmZn1Fu5uursTjqGTi/ocb08m0B4bw4OrC3/C960Y1wfsvsbdsC1guiw2rMTv4E752cWwJC+R3bPQgo/rWNBIY2Btq9iMvX6pthj2tZQMDf0fx9qwANEig5oczrx4oOSoxqq1bz1vkM37KAM6SrmNHhwOmTOppZvUF4OO9RvWdLAgIF1+gRQHo4UMxZYvNw9OGIDRd5yDjj8Bigu9djo3nfH8VLAnqy0WLAw4cPAhKmGKoSmMP4MRjP1G8BPEU3nhYQ5kkhY3WYN10Cuad41cSlGYg5INeF89abUe+KTQt4ZQnkh+1z5EmY54F5bGbf+zolIJTH6Ls7uw7KWT8H7Z7H9WJoc0C7V3PWb4K52SkB62UzuR1kHvJBdT7DNcJAzG27RvNX+o8JCPlROk4PMVO+aiuzhpVf3bODXxYwOgxI/4ICxQ1Q5kVzIQES/8LIGwoUMeQcsn83f4P6bXDG/MKKP0MBoU8CZR/6ebH9jxLIN0L2V84YCjhLru+eNz8H50OF9ZgrcYsLjr3CeGvtE6bVi+q3CGhLoTzYL4Sj5+tPxEDxV97u0y7IPasBKm/bkoC2tN4GFAdbX3iZ5YCFyfteKmx8qTng2KGeLKKFjGv1bQYyzvLadwWE/rDIWgcASVRAsLdBmb8bNwRQcgPhDbaqdbv1Z3xXwBkCYXSImXJALpmvp8LvFzj6v+ktf6DkrPdC7ltd/o7FtwjoDwHS/yPUgTLrKTazmnxUU31kfg7a4njciHOnf7uAOnh0SIRRbcX8DpvztToWpq7dkd8u4Puo/5PgsoDA+wc1HLHpB0cNyriFsbo8lDNQ5jMYOGaEN4O4bv0Z3xVw9LEH3juElb0LQaC+zFpwzFvN961mXj2Z5ebrms99LDys7dRMz7oC1oNwLIcj9kf6GGKM54UD4+u9uLXDz3iMryuG9Z2ai2xJwIggqvWOF37UF+aqQf5toMUDcyKObr1VQKD4edg6/uk6sL0C1maHAo6+A/5Sj/Wxx3wi1m5ZtKtVj7AztaGANQnMf4f8sXDMwRF7jN8FpE+zr1kMWNj1EONaO2uyGdyygLbEkwPpsYC1U/5OXgFQ1D3HC5L6QErrPpD6qfn6UmNUhjNO9ZEBI8ipvy2gmKLjVZdZz7xqd5p4ZeKE9YfbrOav2JSA9TI4DlYvMn9U1FfNMIojUz+qq6aemfKWCeN7ys2sbvmOnxJwhRh4/zWDMjYeIIWQvRLIMRDOe4zi2oBUgsNDjtWAI1ZeG5R9iVtjonxbQCgXenIth9xXrJ55aP9+BueezYmjNiCJDaQW5HnIuWaBhFGcQDd/KQTscUcHAL2RUw8yHrI/AaqCdsKBrXPBVZMp3jU4dohjhW9aQBHPmC2Xl/kZ5WaqK5aXKZZZLC+zmmKZz+vYcnmZ4S1WXhuU4tX9Ub4kYHQIXDtgdOCn+9EbezcsCSiiaAHsiQikn0/iNYNzTT041+FcE1YGyHUNxpguwW9zWcDfma0/QBILDm9EENd838eQ8VENci/6RhteHpArbDRTgF/JloDRIjgf9NqRnGZmLQ1UX2ZnDVeNFymcb9VcAZpMtgQUd7QQzocJu2KQfxXRDJA+tXWsfNeA3dFwbltAsT0povFHO9TbMTiLJ37ZDp9mLgkogmg58P7kCLNixmdesxabV23VgNWRKfxlAXtbYO/oSKio1tttPaD5zdzlNG75WwTUITIR1gbUpY/kQFe41r2rx90ioC1tHQX5MYBBH/NAU7gnlt4qoA5siaieDJB7xKDPrdtkfvnV+HYBdZCOlCmODEifEsg+wszUIM9D9q0Z3SJr9a/UHxHQDpo9GrIAsOZtT8/P3tDj6PUeFVCL9QCZ4k+adsqe3vm4gPYAPUZm+VNeO2RP8de8HxPQFutxZla74o3L/BWundmPC+iPtEeb971ebHj5Hu4TvT8VsH6gBJmxeu4v83+VgH8pxO7ur4C7yr3mvgK+hNh1XwF3lXvNfQV8CbHr/hcF3H3rI3NfAS/K+hXwK+BFBS6O/xcAAP//mN0TigAAAAZJREFUAwA6iHqszGJHLAAAAABJRU5ErkJggg==", "tagline": "", "logoWidth": 300, "logoHeight": 200, "businessName": "Golden Desserts & More"}	2026-05-04 14:39:30.853308+00	2026-05-04 14:41:12.129103+00
21059b7d-af70-4d98-9a4d-d68e2152bfa6	b2e79446-68ff-4f86-89e4-9e0def4e5072	checklist_enable_hand_nail_photo	true	2026-05-08 03:37:01.082845+00	2026-05-08 09:16:57.215266+00
16679162-138b-4a5d-8cd6-bfb11846d0c3	b2e79446-68ff-4f86-89e4-9e0def4e5072	checklist_enable_shoe_photo	true	2026-05-08 03:37:01.07106+00	2026-05-08 09:16:57.370233+00
8e89d0b4-209c-4c0f-a8db-4046e3d4b61d	b2e79446-68ff-4f86-89e4-9e0def4e5072	checklist_enable_safety_audit	true	2026-05-08 03:37:00.742277+00	2026-05-08 09:17:03.597347+00
fb7bfaec-a00b-4148-98a2-80ab52e532ae	b2e79446-68ff-4f86-89e4-9e0def4e5072	checklist_enable_location_verification	true	2026-05-08 03:37:01.059375+00	2026-05-08 09:16:57.679725+00
ce238566-e488-447e-b487-618ad264f1a7	b2e79446-68ff-4f86-89e4-9e0def4e5072	country	"IN"	2026-05-03 17:38:23.230243+00	2026-05-12 02:26:27.881316+00
5bfb1bb9-19ea-4526-99ea-fbfb5be5a48a	b2e79446-68ff-4f86-89e4-9e0def4e5072	pos_ui_customization	{"layout": {"showImages": true, "menuGridCols": 3, "menuPosition": "right", "categoryPosition": "top", "orderPanelPosition": "left"}, "buttons": [{"id": "hold", "icon": "Pause", "group": "cart_actions", "label": "Hold", "visible": true, "position": 1}, {"id": "print", "icon": "Printer", "group": "cart_actions", "label": "Print Bill", "visible": true, "position": 2}, {"id": "kot", "icon": "FileText", "group": "cart_actions", "label": "KOT", "visible": true, "position": 3}, {"id": "kotPrint", "icon": "Receipt", "group": "cart_actions", "label": "KOT + Print", "visible": true, "position": 4}, {"id": "split", "icon": "Scissors", "group": "cart_actions", "label": "Split", "visible": true, "position": 5}, {"id": "discount", "icon": "Percent", "group": "cart_actions", "label": "Discount", "visible": true, "position": 6}, {"id": "customer", "icon": "User", "group": "cart_actions", "label": "Customer", "visible": true, "position": 7}, {"id": "qrMenu", "icon": "QrCode", "group": "cart_actions", "label": "QR Menu", "visible": true, "position": 8}, {"id": "qrOrders", "icon": "QrCode", "group": "cart_actions", "label": "QR Orders", "visible": true, "position": 9}, {"id": "heldBills", "icon": "Play", "group": "cart_actions", "label": "Held Bills", "visible": true, "position": 10}, {"id": "cash", "icon": "Banknote", "group": "payment_actions", "label": "Cash", "visible": true, "position": 1}, {"id": "card", "icon": "CreditCard", "group": "payment_actions", "label": "Card", "visible": true, "position": 2}, {"id": "upi", "icon": "Smartphone", "group": "payment_actions", "label": "UPI", "visible": true, "position": 3}, {"id": "due", "icon": "Clock", "group": "payment_actions", "label": "Due", "visible": true, "position": 4}, {"id": "part", "icon": "SplitSquareHorizontal", "group": "payment_actions", "label": "Part Pay", "visible": true, "position": 5}, {"id": "wallet", "icon": "Wallet", "group": "payment_actions", "label": "Wallet", "visible": true, "position": 6}], "version": 2, "shortcuts": {"kot": "F3", "back": "Ctrl+Backspace", "help": "Ctrl+H", "hold": "Ctrl+Z", "print": "F2", "dineIn": "F11", "search": "F4", "tables": "F7", "kotList": "Ctrl+K", "delivery": "F9", "kotPrint": "F6", "newOrder": "F5", "takeaway": "F12", "orderList": "Ctrl+O", "itemReport": "Ctrl+I", "salesReport": "Ctrl+S"}, "sidebarItems": [{"id": "operations", "icon": "Wrench", "path": "/operations", "label": "Operations", "visible": true, "position": 1}, {"id": "reports", "icon": "BarChart3", "path": "/reports", "label": "Reports", "visible": true, "position": 2}, {"id": "dashboard", "icon": "LayoutDashboard", "path": "/dashboard", "label": "Dashboard", "visible": true, "position": 3}, {"id": "pos", "icon": "ShoppingCart", "path": "/pos", "label": "Billing", "visible": true, "position": 4}, {"id": "tables", "icon": "UtensilsCrossed", "path": "/tables", "label": "Tables", "visible": true, "position": 5}, {"id": "orders", "icon": "Receipt", "path": "/orders", "label": "Orders", "visible": true, "position": 6}, {"id": "pickup", "icon": "Package", "path": "/pickup", "label": "Takeaway", "visible": true, "position": 7}, {"id": "menu", "icon": "Package", "path": "/menu", "label": "Menu", "visible": true, "position": 8}, {"id": "inventory", "icon": "Package", "path": "/inventory", "label": "Inventory", "visible": true, "position": 9}, {"id": "expenses", "icon": "Wallet", "path": "/expenses", "label": "Expenses", "visible": true, "position": 10}, {"id": "delivery", "icon": "Truck", "path": "/delivery", "label": "Delivery", "visible": true, "position": 11}, {"id": "online-orders", "icon": "Globe", "path": "/online-orders", "label": "Online Orders", "visible": true, "position": 12}, {"id": "qr-orders", "icon": "QrCode", "path": "/qr-orders", "label": "Menu Orders", "visible": true, "position": 13}, {"id": "staff", "icon": "Users", "path": "/staff", "label": "Staff", "visible": true, "position": 14}, {"id": "stores", "icon": "Store", "path": "/stores", "label": "Stores", "visible": true, "position": 15}, {"id": "chat", "icon": "MessageSquare", "path": "/chat", "label": "Team Chat", "visible": true, "position": 16}, {"id": "credit-ledger", "icon": "ScrollText", "path": "/credit-ledger", "label": "Credit Ledger", "visible": true, "position": 17}, {"id": "executive-dashboard", "icon": "Gauge", "path": "/executive-dashboard", "label": "Executive Dashboard", "visible": true, "position": 18}, {"id": "ai-control-center", "icon": "Brain", "path": "/ai-control-center", "label": "AI Control Center", "visible": true, "position": 19}, {"id": "dynamic-pricing", "icon": "TrendingUp", "path": "/dynamic-pricing", "label": "Dynamic Pricing", "visible": true, "position": 20}, {"id": "api-management", "icon": "Code", "path": "/api-management", "label": "API Management", "visible": true, "position": 21}, {"id": "tax-engine", "icon": "Calculator", "path": "/tax-engine", "label": "Tax Engine", "visible": true, "position": 22}, {"id": "revenue-forecast", "icon": "LineChart", "path": "/revenue-forecast", "label": "Revenue Forecast", "visible": true, "position": 23}, {"id": "compliance", "icon": "Shield", "path": "/compliance", "label": "Compliance", "visible": true, "position": 24}], "orderSettings": {"playSound": true, "alarmVolume": 1, "playOrderAlarm": true, "autoAcceptOrders": true, "autoPrintQROrders": true, "autoAcceptQROrders": true, "billPrintAfterAutoaccept": true}, "appSidebarOrder": [], "operationsOrder": []}	2026-05-03 18:15:29.789964+00	2026-05-04 04:47:32.863877+00
7bcc9e27-cbc7-45d1-a21b-74e770e3ced7	b2e79446-68ff-4f86-89e4-9e0def4e5072	checklist_require_manager_approval	true	2026-05-08 03:37:01.005682+00	2026-05-08 09:16:57.834616+00
54f87efb-5d72-45a0-bda9-1cee5a4cc8a6	b2e79446-68ff-4f86-89e4-9e0def4e5072	checklist_auto_score_staff	true	2026-05-08 03:37:01.010164+00	2026-05-08 09:16:58.154611+00
52e524cc-968f-419c-bb40-8f33d8d1b865	b2e79446-68ff-4f86-89e4-9e0def4e5072	pos_sales_reset_config	{"enabled": true, "resetMode": "daily", "resetTime": "06:00", "resetHours": 24, "lastResetTime": "2026-05-10T17:59:14.150Z", "warningMinutes": 30}	2026-05-03 17:42:54.246013+00	2026-05-10 17:59:14.270714+00
88e4745d-21a8-47d0-a27b-432c8533d46d	b2e79446-68ff-4f86-89e4-9e0def4e5072	tables	[{"id": "t1", "number": 1, "status": "available", "capacity": 2}, {"id": "t2", "number": 2, "status": "available", "capacity": 2}, {"id": "t3", "number": 3, "status": "available", "capacity": 4}, {"id": "t4", "number": 4, "status": "available", "capacity": 4}, {"id": "t5", "number": 5, "status": "available", "capacity": 4}, {"id": "t6", "number": 6, "status": "available", "capacity": 6}, {"id": "t7", "number": 7, "status": "available", "capacity": 6}, {"id": "t8", "number": 8, "status": "available", "capacity": 8}]	2026-05-03 17:38:20.726694+00	2026-05-12 02:26:25.10547+00
fbda5b3f-12ee-42f4-85f7-de66edaaf3fa	b2e79446-68ff-4f86-89e4-9e0def4e5072	checklist_enable_audit_reports	true	2026-05-08 03:37:01.088892+00	2026-05-08 09:16:58.466247+00
70d30794-f087-4360-9b93-9b879c598317	b2e79446-68ff-4f86-89e4-9e0def4e5072	checklist_enable_daily_hygiene_audit	true	2026-05-08 03:37:01.056847+00	2026-05-08 09:16:58.618301+00
75b2845b-ce3a-4e4a-8546-9feef8dbf331	b2e79446-68ff-4f86-89e4-9e0def4e5072	tax_percent	"5"	2026-05-03 17:38:22.910268+00	2026-05-12 02:26:27.332946+00
26f3ca94-5ee1-4b39-a165-ce011540a27f	b2e79446-68ff-4f86-89e4-9e0def4e5072	checklist_require_live_capture	true	2026-05-08 03:37:01.051359+00	2026-05-08 09:16:58.770517+00
93d73316-459f-47db-abc0-ef41d09faf90	b2e79446-68ff-4f86-89e4-9e0def4e5072	bill_config	"{}"	2026-05-03 17:38:23.073021+00	2026-05-12 02:26:27.611481+00
7c9a0ead-5806-4bc0-9d16-fcb153bf4053	b2e79446-68ff-4f86-89e4-9e0def4e5072	checklist_require_photo_proof	true	2026-05-08 03:37:01.037828+00	2026-05-08 09:16:58.923017+00
2b0ca4ec-2422-473d-a927-9df93313c97d	b2e79446-68ff-4f86-89e4-9e0def4e5072	checklist_require_video_proof	true	2026-05-08 03:37:01.08067+00	2026-05-08 09:16:59.077225+00
c6d4eaaf-7242-4e07-87db-ef51a43a40f9	b2e79446-68ff-4f86-89e4-9e0def4e5072	checklist_enable_scoring	true	2026-05-08 03:37:01.044266+00	2026-05-08 09:16:59.494948+00
c2700db5-15bd-45a8-bba1-36aea899537d	b2e79446-68ff-4f86-89e4-9e0def4e5072	checklist_enable_cleaning_audits	true	2026-05-08 03:37:01.071058+00	2026-05-08 09:16:59.805603+00
8e3fb3db-04c4-4e0f-9774-d8be65380272	b2e79446-68ff-4f86-89e4-9e0def4e5072	checklist_enable_bill_counter_photo	true	2026-05-08 03:37:01.088462+00	2026-05-08 09:17:00.57309+00
99c72fba-8ba1-460b-9221-82dc2e4b5d61	b2e79446-68ff-4f86-89e4-9e0def4e5072	checklist_enable_checklist_tasks	true	2026-05-08 09:11:42.673879+00	2026-05-08 09:17:01.627611+00
e073094c-4260-4993-b8fc-4220c69e9484	b2e79446-68ff-4f86-89e4-9e0def4e5072	checklist_enable_surprise_audits	true	2026-05-08 03:37:00.73762+00	2026-05-08 09:17:02.551473+00
f0d8d3a3-d2bd-4953-9408-6dfbf129f0b9	b2e79446-68ff-4f86-89e4-9e0def4e5072	checklist_enable_qr_nfc_staff_checkin	true	2026-05-08 03:37:00.714112+00	2026-05-08 09:17:02.699822+00
20ef71f9-73b9-4614-8b00-0730bfb067e5	b2e79446-68ff-4f86-89e4-9e0def4e5072	checklist_enable_opening_audit	true	2026-05-08 03:37:00.714408+00	2026-05-08 09:17:02.848192+00
de215c85-9f29-4f9b-b2b1-71e5c2c1647a	b2e79446-68ff-4f86-89e4-9e0def4e5072	checklist_enable_selfie_verification	true	2026-05-08 03:37:01.107144+00	2026-05-08 09:16:57.061213+00
355af478-947a-441d-9c20-0f1f37bbdaa6	b2e79446-68ff-4f86-89e4-9e0def4e5072	checklist_enable_hygiene_audits	true	2026-05-08 03:37:01.201189+00	2026-05-08 09:16:59.652824+00
7f93fc17-f3bb-4c9f-a9cf-6950f094b189	b2e79446-68ff-4f86-89e4-9e0def4e5072	checklist_lock_after_submission	true	2026-05-08 03:37:01.097219+00	2026-05-08 09:17:01.025991+00
fcf507df-8cf7-4ed4-b915-ab8a5a85098c	b2e79446-68ff-4f86-89e4-9e0def4e5072	checklist_enable_staff_scoring	true	2026-05-08 09:11:42.845784+00	2026-05-08 09:17:01.779869+00
0e45da0c-4a08-485e-b882-693a3afd643f	b2e79446-68ff-4f86-89e4-9e0def4e5072	checklist_enable_uniform_photo	true	2026-05-08 03:37:01.16465+00	2026-05-08 09:16:57.525827+00
e6806bb1-7b9f-4378-84fb-82069c23d06d	b2e79446-68ff-4f86-89e4-9e0def4e5072	checklist_allow_reupload	true	2026-05-08 03:37:01.201223+00	2026-05-08 09:17:00.876431+00
59acdfb8-be8b-4297-ac2f-1af905a4dc1a	b2e79446-68ff-4f86-89e4-9e0def4e5072	checklist_auto_assign_tasks	true	2026-05-08 09:11:42.997811+00	2026-05-08 09:17:01.930616+00
60482d08-fadc-4be9-a71d-3f643a19fa48	b2e79446-68ff-4f86-89e4-9e0def4e5072	checklist_enable_auto_sync	true	2026-05-08 03:37:01.102147+00	2026-05-08 09:17:02.233314+00
9da50c75-b462-497b-9018-de9ae734352c	b2e79446-68ff-4f86-89e4-9e0def4e5072	checklist_allow_multiple_per_day	true	2026-05-08 03:37:01.178541+00	2026-05-08 09:16:58.00288+00
f98f6427-02c7-4a67-9fed-b81055a7eca6	b2e79446-68ff-4f86-89e4-9e0def4e5072	checklist_auto_mark_incomplete	true	2026-05-08 03:37:01.099952+00	2026-05-08 09:16:58.315704+00
665af783-1af3-462e-a61e-2d32d805cb4b	b2e79446-68ff-4f86-89e4-9e0def4e5072	checklist_enable_workstation_photo	true	2026-05-08 03:37:01.210459+00	2026-05-08 09:16:59.95488+00
d3ef3715-b3c8-4413-951c-c395d36b2af6	b2e79446-68ff-4f86-89e4-9e0def4e5072	checklist_enable_real_time_monitoring	true	2026-05-08 03:37:01.202197+00	2026-05-08 09:17:02.397552+00
6c84af5b-903f-4c15-b1db-8a67529606ca	b2e79446-68ff-4f86-89e4-9e0def4e5072	checklist_enable_kitchen_photo	true	2026-05-08 03:37:01.200816+00	2026-05-08 09:17:00.223429+00
df8500f3-de22-44e5-a0c7-bf50a6f606aa	b2e79446-68ff-4f86-89e4-9e0def4e5072	checklist_enable_cleaning_proof_photo	true	2026-05-08 03:37:01.100754+00	2026-05-08 09:17:00.723908+00
7304f744-7520-40ae-ba2f-c75d2bd98699	b2e79446-68ff-4f86-89e4-9e0def4e5072	checklist_enable_offline_checklist_mode	true	2026-05-08 03:37:01.21889+00	2026-05-08 09:17:02.080789+00
b13ae727-b843-413e-8ac8-9016a23a87f4	b2e79446-68ff-4f86-89e4-9e0def4e5072	checklist_require_gps_proof	true	2026-05-08 03:37:01.107452+00	2026-05-08 09:16:59.247334+00
cf46cb9a-18ca-4c98-bb85-708787b8d223	b2e79446-68ff-4f86-89e4-9e0def4e5072	checklist_enable_equipment_photo	true	2026-05-08 03:37:01.307566+00	2026-05-08 09:17:00.42463+00
0340a1c6-c946-4886-9ac4-3e4134da2405	b2e79446-68ff-4f86-89e4-9e0def4e5072	checklist_enable_auto_rejection	true	2026-05-08 03:37:01.209996+00	2026-05-08 09:17:01.177034+00
68ca0561-e35b-4d61-8e82-264e9f44317e	b2e79446-68ff-4f86-89e4-9e0def4e5072	checklist_enable_penalties	true	2026-05-08 03:37:01.200895+00	2026-05-08 09:17:01.328783+00
0b752fad-aa6a-4d18-9111-caf4a3415d1b	b2e79446-68ff-4f86-89e4-9e0def4e5072	checklist_enable_staff_rewards	true	2026-05-08 03:37:01.307558+00	2026-05-08 09:17:01.478031+00
\.


--
-- Data for Name: subscription_categories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.subscription_categories (id, key, name, is_active, sort_order, created_at, updated_at) FROM stdin;
20df5656-1ea7-4640-94be-77f8e1b4e5f1	restaurant	Restaurant	t	1	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
9919631f-5a67-4f5c-89c9-03a52e50c69b	retail	Retail Store	t	2	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
\.


--
-- Data for Name: subscription_plans; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.subscription_plans (id, category_id, tier_key, name, description, is_active, is_visible, monthly_price, yearly_price, sort_order, created_at, updated_at) FROM stdin;
32e2d242-c7fc-4f46-892a-4572f2306bd7	20df5656-1ea7-4640-94be-77f8e1b4e5f1	basic	Basic Plan	\N	t	t	0.00	\N	1	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
1209000d-9d27-4467-95da-c4a2d623902f	9919631f-5a67-4f5c-89c9-03a52e50c69b	basic	Basic Plan	\N	t	t	0.00	\N	1	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
f0b45032-eb52-4d0f-87d9-acd81d4d0a9e	20df5656-1ea7-4640-94be-77f8e1b4e5f1	gold	Gold Plan	\N	t	t	999.00	\N	2	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
6a81d742-c374-4613-b022-68c88d8259ea	9919631f-5a67-4f5c-89c9-03a52e50c69b	gold	Gold Plan	\N	t	t	999.00	\N	2	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
1d4f7e8d-43b4-4f49-a47a-e4f627bc7260	20df5656-1ea7-4640-94be-77f8e1b4e5f1	platinum	Platinum Plan	\N	t	t	2499.00	\N	3	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
b96a0a14-fc58-4541-b470-1c964ef727b4	9919631f-5a67-4f5c-89c9-03a52e50c69b	platinum	Platinum Plan	\N	t	t	2499.00	\N	3	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
\.


--
-- Data for Name: subscription_plan_features; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.subscription_plan_features (id, plan_id, feature_key, is_enabled, created_at, updated_at) FROM stdin;
cda6fba7-1069-4062-9d93-d3781788cdb5	32e2d242-c7fc-4f46-892a-4572f2306bd7	billing	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
8592666f-aaec-4852-a719-1f8392705c95	32e2d242-c7fc-4f46-892a-4572f2306bd7	gstInvoice	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
856ab28c-8c29-4590-ab92-7b39ddbecdd9	32e2d242-c7fc-4f46-892a-4572f2306bd7	multiplePayments	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
8400d7e1-6685-4e04-aefb-4bdfa3b32bbe	32e2d242-c7fc-4f46-892a-4572f2306bd7	basicReports	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
b157374e-5574-4889-b3b2-17a11b6026b6	32e2d242-c7fc-4f46-892a-4572f2306bd7	menuManagement	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
3616a812-36c8-4fa9-88b3-e63eafa829c6	32e2d242-c7fc-4f46-892a-4572f2306bd7	basicInventory	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
760c9f07-3652-4b61-927f-2dd82b848b3e	32e2d242-c7fc-4f46-892a-4572f2306bd7	manualInventory	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
f13230cd-0cef-4767-90ad-5ceeaf41874f	32e2d242-c7fc-4f46-892a-4572f2306bd7	customerManagement	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
8bebb20b-6741-4e9b-9abf-a9f44c09339b	32e2d242-c7fc-4f46-892a-4572f2306bd7	support247	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
2ecf8174-3e11-4a0a-adfa-1df7892fc14d	32e2d242-c7fc-4f46-892a-4572f2306bd7	barcodeScanner	f	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
2304575c-b2a6-4d34-95e9-67c24e332c9d	32e2d242-c7fc-4f46-892a-4572f2306bd7	dineIn	f	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
a409d389-1638-4264-a604-3a5f10f04289	32e2d242-c7fc-4f46-892a-4572f2306bd7	takeaway	f	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
042803cf-2c77-4a3c-9c4f-936290eb1cec	32e2d242-c7fc-4f46-892a-4572f2306bd7	delivery	f	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
80ae07e8-2a85-4a85-a9ac-253fc7f6f336	32e2d242-c7fc-4f46-892a-4572f2306bd7	cashFlow	f	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
072b999f-3d10-4860-974b-5f5ea2d1df82	32e2d242-c7fc-4f46-892a-4572f2306bd7	withdrawal	f	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
dca5f271-1267-4465-bbcd-40d9baaff7dc	32e2d242-c7fc-4f46-892a-4572f2306bd7	cashTopUp	f	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
1011ef13-25b6-4cb8-b7a1-d78b714ff9f0	32e2d242-c7fc-4f46-892a-4572f2306bd7	paymentSettings	f	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
a1c7850a-20a8-4ece-ad85-a8cb1f0024b7	32e2d242-c7fc-4f46-892a-4572f2306bd7	paymentAnalytics	f	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
36362849-be1a-4936-bc58-87fcb3badb24	32e2d242-c7fc-4f46-892a-4572f2306bd7	paymentReconciliation	f	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
7dc6234f-71fd-44ad-9724-e4a1212a2495	32e2d242-c7fc-4f46-892a-4572f2306bd7	dailyReconciliation	f	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
1c33b1a3-d267-42d6-b0c5-c3d575b2913b	32e2d242-c7fc-4f46-892a-4572f2306bd7	paymentSettlements	f	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
61f03ffb-b12f-4af9-bd91-e8e586c3ea3e	32e2d242-c7fc-4f46-892a-4572f2306bd7	paymentDisputes	f	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
592eaf48-d075-472a-a76c-70496934cff1	32e2d242-c7fc-4f46-892a-4572f2306bd7	refundManagement	f	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
617c6e3e-7519-49bc-9327-7a66614cac95	32e2d242-c7fc-4f46-892a-4572f2306bd7	paymentAlerts	f	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
a9b9c99e-b465-4e68-8d38-d53a37d3a333	32e2d242-c7fc-4f46-892a-4572f2306bd7	paymentHistory	f	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
812d06f1-017e-430f-8cb1-b377443766de	32e2d242-c7fc-4f46-892a-4572f2306bd7	customerNotifications	f	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
e26ac2c9-de3b-4fe1-a7f1-6c6d0e08b248	32e2d242-c7fc-4f46-892a-4572f2306bd7	orderSummaryReport	f	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
fdde0a56-c3be-4a01-8098-bf05cabac02b	32e2d242-c7fc-4f46-892a-4572f2306bd7	executiveSaleReport	f	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
67774bed-99d4-4fb5-9228-c90b2c4b2aae	32e2d242-c7fc-4f46-892a-4572f2306bd7	employeeSummaryReport	f	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
891d3e66-a95f-423d-91b7-13b9c0bfccef	32e2d242-c7fc-4f46-892a-4572f2306bd7	groupSummaryReport	f	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
b92d6dc0-3724-4449-bebc-56b1d45769ea	32e2d242-c7fc-4f46-892a-4572f2306bd7	variationSummaryReport	f	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
5bc3f4d6-7fe9-4fad-9b9e-47f5554e13ef	32e2d242-c7fc-4f46-892a-4572f2306bd7	coverSizeSummaryReport	f	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
b3d1e48b-6a64-4b49-91be-a0b94c7b8dc8	32e2d242-c7fc-4f46-892a-4572f2306bd7	tipSummaryReport	f	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
0408c4c8-3308-40fc-9c53-5a8b8490b649	32e2d242-c7fc-4f46-892a-4572f2306bd7	counterSummaryReport	f	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
1850fb16-513b-493d-9ff6-def7df8a4823	32e2d242-c7fc-4f46-892a-4572f2306bd7	deliveryBoys	f	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
80075c13-0ccf-479d-ae40-83478d35dbc1	32e2d242-c7fc-4f46-892a-4572f2306bd7	liveView	f	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
ea0ceb34-2741-4d5e-89c5-317573290ddd	32e2d242-c7fc-4f46-892a-4572f2306bd7	fullInventory	f	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
0501a3ad-bddf-4746-90d1-b507a26fcf03	32e2d242-c7fc-4f46-892a-4572f2306bd7	recipeManagement	f	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
19feb4ec-becb-43ea-8a01-304275be50d5	32e2d242-c7fc-4f46-892a-4572f2306bd7	recipeInventory	f	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
32010526-3eb9-4dc9-b716-8b08602629f8	32e2d242-c7fc-4f46-892a-4572f2306bd7	advancedReports	f	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
e2f9d0d2-e596-4e8c-97ec-6c8f87ab16e0	32e2d242-c7fc-4f46-892a-4572f2306bd7	expenseTracking	f	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
966bb18d-4573-4d98-83e6-d99b0a7f251d	32e2d242-c7fc-4f46-892a-4572f2306bd7	tableManagement	f	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
111c2acc-54d0-4e0c-bf63-6ed8b76789ec	32e2d242-c7fc-4f46-892a-4572f2306bd7	qrMenuOrdering	f	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
86db4d21-f542-4086-ab61-4d3f558a34ed	32e2d242-c7fc-4f46-892a-4572f2306bd7	staffManagement	f	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
bf7b4262-8152-4f0a-a9e4-8d302e433767	32e2d242-c7fc-4f46-892a-4572f2306bd7	faceVerification	f	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
44766870-7f5f-482a-a7d1-315153428ea3	32e2d242-c7fc-4f46-892a-4572f2306bd7	geoFencing	f	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
7eea6e91-8cdf-44ae-9c06-06af908d355e	32e2d242-c7fc-4f46-892a-4572f2306bd7	swiggyZomato	f	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
8a2d10a9-77b8-4c92-b0db-97b78546b872	32e2d242-c7fc-4f46-892a-4572f2306bd7	teamChat	f	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
bec0e131-0997-4cc0-99e4-8c3136669f5f	32e2d242-c7fc-4f46-892a-4572f2306bd7	thirdPartyIntegration	f	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
53ad6e68-65a5-438c-9f9c-8f8d6f121255	32e2d242-c7fc-4f46-892a-4572f2306bd7	multiOutlet	f	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
11ded89a-f7b0-43da-9ebc-6e0388da1b16	32e2d242-c7fc-4f46-892a-4572f2306bd7	centralDashboard	f	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
ffabf37c-bff7-41cf-892c-ee5f4968cb07	32e2d242-c7fc-4f46-892a-4572f2306bd7	apiIntegrations	f	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
6308dc5e-83e2-4bd7-8e78-25738f4bb890	32e2d242-c7fc-4f46-892a-4572f2306bd7	alertsNotifications	f	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
6b6afacc-2a64-4d0d-9c61-2e4ceb77fd58	32e2d242-c7fc-4f46-892a-4572f2306bd7	autoStockSystem	f	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
2278a18f-7d7e-4a6b-bc38-c957d0b778d1	32e2d242-c7fc-4f46-892a-4572f2306bd7	smartInventory	f	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
32cf633d-1f18-421b-952c-ded6c2bae91f	32e2d242-c7fc-4f46-892a-4572f2306bd7	deliveryTracking	f	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
5fc25785-bf66-4c52-b67e-53948b7d6f60	32e2d242-c7fc-4f46-892a-4572f2306bd7	crmLoyalty	f	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
1ce47b96-c893-49a5-bc96-9627768758ef	1209000d-9d27-4467-95da-c4a2d623902f	billing	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
a41c4e6d-5723-4513-92dd-5f0be3bc5525	1209000d-9d27-4467-95da-c4a2d623902f	gstInvoice	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
67df6f3f-0b2e-42c1-9ae0-40a5eaa8c5a2	1209000d-9d27-4467-95da-c4a2d623902f	multiplePayments	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
04e5f7ec-ca37-4743-937e-c975a90a3d9a	1209000d-9d27-4467-95da-c4a2d623902f	basicReports	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
0a26cbaa-ca6c-4c2a-9b15-e3414ea2d981	1209000d-9d27-4467-95da-c4a2d623902f	menuManagement	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
ac3be281-927d-4d0a-85a2-de8f22043ce6	1209000d-9d27-4467-95da-c4a2d623902f	basicInventory	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
0c3278bb-8d1c-4bcd-9fdb-bf1a7acfb418	1209000d-9d27-4467-95da-c4a2d623902f	manualInventory	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
e522c83c-83f5-44b7-a428-d8fcd9fa07e1	1209000d-9d27-4467-95da-c4a2d623902f	customerManagement	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
990247d7-d57a-46dc-818a-051f92146de4	1209000d-9d27-4467-95da-c4a2d623902f	support247	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
9e2b02f8-1e11-4c97-a301-5f82e9b7052f	1209000d-9d27-4467-95da-c4a2d623902f	barcodeScanner	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
c39fa219-15d6-45d8-9421-b65485a268a0	1209000d-9d27-4467-95da-c4a2d623902f	dineIn	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
bf65caf0-7204-4c2e-b2c0-1ee4caa05e37	1209000d-9d27-4467-95da-c4a2d623902f	takeaway	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
345252a4-d76c-4f38-8d65-74847f79dda2	1209000d-9d27-4467-95da-c4a2d623902f	delivery	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
d67bf337-1cd4-4b45-b7eb-5b90f2194090	1209000d-9d27-4467-95da-c4a2d623902f	cashFlow	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
5b723d2b-b76d-4ef2-a552-01ff80474edb	1209000d-9d27-4467-95da-c4a2d623902f	withdrawal	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
aad080d0-1e8f-42ed-8d62-e2fed6043403	1209000d-9d27-4467-95da-c4a2d623902f	cashTopUp	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
6bbc4b82-8307-4dd5-8145-a53c5c7b3afe	1209000d-9d27-4467-95da-c4a2d623902f	paymentSettings	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
46f5da90-4d6d-4024-9797-faa5b9b3628a	1209000d-9d27-4467-95da-c4a2d623902f	paymentAnalytics	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
086b4e4a-3a4a-4624-be7f-696db836d942	1209000d-9d27-4467-95da-c4a2d623902f	paymentReconciliation	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
2e621047-23aa-4824-8d19-3702fa5f49ad	1209000d-9d27-4467-95da-c4a2d623902f	dailyReconciliation	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
0168eaa0-a685-49d6-8e6c-157b7e20d6a4	1209000d-9d27-4467-95da-c4a2d623902f	paymentSettlements	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
9efabaa3-f405-49be-a273-fdd6b9ba8847	1209000d-9d27-4467-95da-c4a2d623902f	paymentDisputes	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
9f3cac31-7fb1-47b7-8e44-03a7f7e6521d	1209000d-9d27-4467-95da-c4a2d623902f	refundManagement	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
597e71c5-7d8c-4824-b3fb-6bc3bb428b1c	1209000d-9d27-4467-95da-c4a2d623902f	paymentAlerts	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
f9daed21-650c-4d66-8769-3e359fdffed7	1209000d-9d27-4467-95da-c4a2d623902f	paymentHistory	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
df15fb5b-1878-4865-8398-045eaff4cee5	1209000d-9d27-4467-95da-c4a2d623902f	customerNotifications	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
07ab4192-4294-485d-9f8b-fb864dfe97a2	1209000d-9d27-4467-95da-c4a2d623902f	orderSummaryReport	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
cf2e0992-06bb-4e12-a7f4-a375984de86e	1209000d-9d27-4467-95da-c4a2d623902f	executiveSaleReport	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
dc82aca9-a84b-4c0c-b208-3518c5cd8843	1209000d-9d27-4467-95da-c4a2d623902f	employeeSummaryReport	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
46aa2cfd-bb5e-4342-99bf-e1393be84a23	1209000d-9d27-4467-95da-c4a2d623902f	groupSummaryReport	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
ead1fcc9-63ea-428f-91df-0add8baae11f	1209000d-9d27-4467-95da-c4a2d623902f	variationSummaryReport	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
1b76d718-a067-469d-b3f7-217ca2ed66dc	1209000d-9d27-4467-95da-c4a2d623902f	coverSizeSummaryReport	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
7763ccaf-69a2-4375-a8c3-b66b249f7e45	1209000d-9d27-4467-95da-c4a2d623902f	tipSummaryReport	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
1ebe3a2b-ef9f-490f-be2c-f92b906bf1db	1209000d-9d27-4467-95da-c4a2d623902f	counterSummaryReport	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
ca47f944-d422-47d7-b2f4-9791ba697589	1209000d-9d27-4467-95da-c4a2d623902f	deliveryBoys	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
186b15bb-5748-4432-82b3-43f2016c736c	1209000d-9d27-4467-95da-c4a2d623902f	liveView	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
ff3a34d7-1634-48d8-9625-3190caf11fa5	1209000d-9d27-4467-95da-c4a2d623902f	fullInventory	f	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
bfff6ba4-c15a-42de-a4b5-575524f3dd13	1209000d-9d27-4467-95da-c4a2d623902f	recipeManagement	f	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
63856e82-d899-403a-a831-15d752a3fb83	1209000d-9d27-4467-95da-c4a2d623902f	recipeInventory	f	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
238b1f3f-cc8c-44ec-aba9-638deb0d5df4	1209000d-9d27-4467-95da-c4a2d623902f	advancedReports	f	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
6219b86f-80ee-4f6e-9c57-0768da8c2abb	1209000d-9d27-4467-95da-c4a2d623902f	expenseTracking	f	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
b627909e-3957-4ec2-aff8-8465d21d25b2	1209000d-9d27-4467-95da-c4a2d623902f	tableManagement	f	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
c7e6c1a4-3ba9-460f-9f1f-ca9dcb62456c	1209000d-9d27-4467-95da-c4a2d623902f	qrMenuOrdering	f	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
c9f6209f-9c6d-49be-bdea-9116a4e8c549	1209000d-9d27-4467-95da-c4a2d623902f	staffManagement	f	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
3b1fb334-9689-4891-8180-5a57420032a9	1209000d-9d27-4467-95da-c4a2d623902f	faceVerification	f	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
8f677d22-1425-4093-bdd3-0308d8c41f9a	1209000d-9d27-4467-95da-c4a2d623902f	geoFencing	f	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
96a13725-3be0-4c22-b709-cb365e0298d1	1209000d-9d27-4467-95da-c4a2d623902f	swiggyZomato	f	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
26e5e421-c940-4571-9cb8-6f091b0e7240	1209000d-9d27-4467-95da-c4a2d623902f	teamChat	f	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
12591896-b574-42e2-a815-3027d7d68e81	1209000d-9d27-4467-95da-c4a2d623902f	thirdPartyIntegration	f	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
339cf803-cf87-498a-ba42-84d60b9bbfa6	1209000d-9d27-4467-95da-c4a2d623902f	multiOutlet	f	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
11cd1867-cf43-47c0-bd30-a013f7ec1cf5	1209000d-9d27-4467-95da-c4a2d623902f	centralDashboard	f	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
16d973e8-5857-4fa4-822b-23cde98fdd3e	1209000d-9d27-4467-95da-c4a2d623902f	apiIntegrations	f	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
81434cbf-fb28-4b78-89d2-2f2dd78d413a	1209000d-9d27-4467-95da-c4a2d623902f	alertsNotifications	f	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
019f4db0-34ac-4926-be8a-97cb848db2bf	1209000d-9d27-4467-95da-c4a2d623902f	autoStockSystem	f	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
a759eb07-b6c5-44b9-babb-0e8dfef7b4c4	1209000d-9d27-4467-95da-c4a2d623902f	smartInventory	f	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
982ad785-aaf3-476f-a370-c9f5aa075e5c	1209000d-9d27-4467-95da-c4a2d623902f	deliveryTracking	f	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
bbd54843-d850-47b2-aa47-29ce3fe8f749	1209000d-9d27-4467-95da-c4a2d623902f	crmLoyalty	f	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
bb5a28fd-7fc5-47fa-8ada-5628a4bf1f07	f0b45032-eb52-4d0f-87d9-acd81d4d0a9e	billing	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
58600ee8-cce6-493f-85e9-567495d1a3fd	f0b45032-eb52-4d0f-87d9-acd81d4d0a9e	gstInvoice	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
88522a6c-02a6-448e-a429-0596ab5d94d5	f0b45032-eb52-4d0f-87d9-acd81d4d0a9e	multiplePayments	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
19291c3c-67f6-4d95-84dd-330c68f1acf7	f0b45032-eb52-4d0f-87d9-acd81d4d0a9e	basicReports	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
350f3f6d-7b02-4edf-a47b-29f8870172da	f0b45032-eb52-4d0f-87d9-acd81d4d0a9e	menuManagement	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
2f4a969f-a7be-4ccd-b07f-e179b39e1ac0	f0b45032-eb52-4d0f-87d9-acd81d4d0a9e	basicInventory	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
cab11275-9a86-40c4-b8fb-31366df6ad28	f0b45032-eb52-4d0f-87d9-acd81d4d0a9e	manualInventory	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
959806de-9f18-4448-a592-4bc4d991c956	f0b45032-eb52-4d0f-87d9-acd81d4d0a9e	customerManagement	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
b35cb7ad-133e-4e5b-9ff6-a3b908a53b6f	f0b45032-eb52-4d0f-87d9-acd81d4d0a9e	support247	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
838b882a-722b-453d-8e5d-55742ae72e04	f0b45032-eb52-4d0f-87d9-acd81d4d0a9e	barcodeScanner	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
3485122c-f1c5-4542-b9d1-f979869f1746	f0b45032-eb52-4d0f-87d9-acd81d4d0a9e	dineIn	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
85c37953-1ab9-46dd-97ce-e96fed996766	f0b45032-eb52-4d0f-87d9-acd81d4d0a9e	takeaway	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
8496b704-26e0-40e0-aed0-32509e9cfc54	f0b45032-eb52-4d0f-87d9-acd81d4d0a9e	delivery	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
56851ebd-be9f-4e8b-9fbd-2e3fdbd1e6bd	f0b45032-eb52-4d0f-87d9-acd81d4d0a9e	paymentSettings	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
937a75b3-296a-44cc-b279-b1b119975601	f0b45032-eb52-4d0f-87d9-acd81d4d0a9e	paymentAnalytics	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
f7f87ae0-785f-4023-8187-d738bc7ff244	f0b45032-eb52-4d0f-87d9-acd81d4d0a9e	paymentReconciliation	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
7e7d0259-87c3-4b77-9893-966f63d89a03	f0b45032-eb52-4d0f-87d9-acd81d4d0a9e	dailyReconciliation	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
a835a9c9-7f86-4379-9a4d-f3de2d85567a	f0b45032-eb52-4d0f-87d9-acd81d4d0a9e	paymentSettlements	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
db024d1e-5057-4fe0-aa5c-6480f2231982	f0b45032-eb52-4d0f-87d9-acd81d4d0a9e	paymentDisputes	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
fc8b209d-9e4f-48c3-abf6-e56c413e9198	f0b45032-eb52-4d0f-87d9-acd81d4d0a9e	refundManagement	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
99ab347e-4203-4d60-8fb9-2246d44ee098	f0b45032-eb52-4d0f-87d9-acd81d4d0a9e	paymentAlerts	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
b05281f7-d392-4eb8-8a85-fecffbe70ddc	f0b45032-eb52-4d0f-87d9-acd81d4d0a9e	paymentHistory	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
693fa5da-5b71-43a5-85cc-d25601766a02	f0b45032-eb52-4d0f-87d9-acd81d4d0a9e	customerNotifications	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
8f99b9b7-eedc-44ae-9cbf-d6bffd8afc1d	f0b45032-eb52-4d0f-87d9-acd81d4d0a9e	orderSummaryReport	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
b7366454-f58a-4245-87f0-5cd4d424cdff	f0b45032-eb52-4d0f-87d9-acd81d4d0a9e	executiveSaleReport	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
6fd0d28e-4c62-4d53-bf32-f08a7c9b3329	f0b45032-eb52-4d0f-87d9-acd81d4d0a9e	deliveryBoys	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
ce7a2f42-5f75-4e32-9abf-0550397b3191	f0b45032-eb52-4d0f-87d9-acd81d4d0a9e	liveView	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
1e3b99c9-b4ae-4776-910a-bd9dfaf9bac6	f0b45032-eb52-4d0f-87d9-acd81d4d0a9e	fullInventory	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
afeaf87a-5426-463f-8d7e-8f0a5b5fab3b	f0b45032-eb52-4d0f-87d9-acd81d4d0a9e	recipeManagement	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
106c89db-80ab-4506-aca2-71a2b810d42d	f0b45032-eb52-4d0f-87d9-acd81d4d0a9e	recipeInventory	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
cf31a329-68e4-4b6e-91af-dbc3e5ae8207	f0b45032-eb52-4d0f-87d9-acd81d4d0a9e	advancedReports	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
74e9b66e-6c9f-4d62-b96d-8b86b7975aac	f0b45032-eb52-4d0f-87d9-acd81d4d0a9e	expenseTracking	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
5fe80b4b-ee8f-431e-b123-f2e9b616f81f	f0b45032-eb52-4d0f-87d9-acd81d4d0a9e	tableManagement	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
069e5ad6-7324-4adf-acf5-01d164e8a5d7	f0b45032-eb52-4d0f-87d9-acd81d4d0a9e	qrMenuOrdering	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
00633e7e-7850-4faf-bfe2-1eadd78eeeba	f0b45032-eb52-4d0f-87d9-acd81d4d0a9e	staffManagement	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
19d0fa00-d60a-42f9-bf69-89279a2c038f	f0b45032-eb52-4d0f-87d9-acd81d4d0a9e	faceVerification	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
476faacc-a309-4ed1-9ef0-4c92bf02a058	f0b45032-eb52-4d0f-87d9-acd81d4d0a9e	geoFencing	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
8c88be14-0770-41d8-b3ec-12c969afa461	f0b45032-eb52-4d0f-87d9-acd81d4d0a9e	swiggyZomato	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
715e5c80-3255-4604-b56b-4f174848bc19	f0b45032-eb52-4d0f-87d9-acd81d4d0a9e	teamChat	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
008eeed5-391b-4614-9d14-a02061bdce72	f0b45032-eb52-4d0f-87d9-acd81d4d0a9e	thirdPartyIntegration	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
95120da6-77da-421e-b039-f513428cdec8	f0b45032-eb52-4d0f-87d9-acd81d4d0a9e	multiOutlet	f	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
d3f25838-9ade-46c6-a0a8-c2d00196393c	f0b45032-eb52-4d0f-87d9-acd81d4d0a9e	centralDashboard	f	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
23555091-5c34-4878-8fba-387e04ca193f	f0b45032-eb52-4d0f-87d9-acd81d4d0a9e	apiIntegrations	f	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
93703540-06a8-416b-a144-1ea259e1192a	f0b45032-eb52-4d0f-87d9-acd81d4d0a9e	alertsNotifications	f	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
b560b1b8-bd30-4b3d-a43b-df9a7ff60412	f0b45032-eb52-4d0f-87d9-acd81d4d0a9e	autoStockSystem	f	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
2612cae5-cbbc-4277-bed5-7dfba86e2070	f0b45032-eb52-4d0f-87d9-acd81d4d0a9e	smartInventory	f	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
e0844b61-d83f-4f8f-9660-5e6ab9e52891	f0b45032-eb52-4d0f-87d9-acd81d4d0a9e	deliveryTracking	f	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
a0a411c6-a34d-4247-bd3c-23b3ca1a6b7d	f0b45032-eb52-4d0f-87d9-acd81d4d0a9e	crmLoyalty	f	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
83ae6829-7d2f-4428-a8bd-395a0a69f879	6a81d742-c374-4613-b022-68c88d8259ea	billing	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
6875b422-087a-4b28-bd56-c67bcd2b2b98	6a81d742-c374-4613-b022-68c88d8259ea	gstInvoice	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
7ea75e21-b720-465a-a789-b6657662a761	6a81d742-c374-4613-b022-68c88d8259ea	multiplePayments	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
320ca165-1e3f-4e24-9e23-ea6a419e1767	6a81d742-c374-4613-b022-68c88d8259ea	basicReports	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
950185ef-e04b-438d-a67c-d28a714b881f	6a81d742-c374-4613-b022-68c88d8259ea	menuManagement	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
c4c7afd2-a2b1-4987-a8a9-ec68ee70292e	6a81d742-c374-4613-b022-68c88d8259ea	basicInventory	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
f3eac832-1743-45e2-9d1e-2035fe1e59f4	6a81d742-c374-4613-b022-68c88d8259ea	manualInventory	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
a43ee35e-73a0-41c3-a658-488aa46b7b25	6a81d742-c374-4613-b022-68c88d8259ea	customerManagement	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
0b867ce6-2fc8-4fed-b1c5-22f43a6b434f	6a81d742-c374-4613-b022-68c88d8259ea	support247	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
f86ec0d6-e3f2-4050-8851-cf4d98efec0c	6a81d742-c374-4613-b022-68c88d8259ea	barcodeScanner	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
d4d23f4d-c9b8-4b2e-83ac-fdc458eaf14d	6a81d742-c374-4613-b022-68c88d8259ea	dineIn	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
e547d723-0007-4243-ad29-975ed6726a80	6a81d742-c374-4613-b022-68c88d8259ea	takeaway	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
d40f1b5b-8aaf-43b5-b307-349e80602ff6	6a81d742-c374-4613-b022-68c88d8259ea	delivery	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
e0ec0fa7-6cb4-4476-a1f2-2ae5dad47095	6a81d742-c374-4613-b022-68c88d8259ea	cashFlow	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
cbdfcc63-81e8-4a0b-b7b2-8442ac003597	6a81d742-c374-4613-b022-68c88d8259ea	withdrawal	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
fc089d3e-765d-496f-972f-76413323b755	6a81d742-c374-4613-b022-68c88d8259ea	cashTopUp	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
f60ac764-8962-447e-8b0a-58c6cd0691fe	6a81d742-c374-4613-b022-68c88d8259ea	paymentSettings	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
510529d2-62c2-4f0b-bb3f-5e726ca400fc	6a81d742-c374-4613-b022-68c88d8259ea	paymentAnalytics	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
0ae04296-e78f-4cbc-ba81-879ab7e8da5d	6a81d742-c374-4613-b022-68c88d8259ea	paymentReconciliation	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
12eee79b-1346-4318-ba5b-54dd44ec0a74	6a81d742-c374-4613-b022-68c88d8259ea	dailyReconciliation	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
e10307be-53a4-4427-b345-34f43a2397e8	6a81d742-c374-4613-b022-68c88d8259ea	paymentSettlements	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
3eb7b9b4-e881-4e19-8a1b-d8f767934c50	6a81d742-c374-4613-b022-68c88d8259ea	paymentDisputes	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
217cd20c-0436-4bf0-a312-e902cee51967	6a81d742-c374-4613-b022-68c88d8259ea	refundManagement	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
a42cc930-d970-4bd5-8168-ed9e5aad1394	6a81d742-c374-4613-b022-68c88d8259ea	paymentAlerts	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
0cadbfee-3fbb-4d1f-affc-6c60623a58ea	6a81d742-c374-4613-b022-68c88d8259ea	paymentHistory	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
4a4430c5-6ea1-4123-b80a-f66f9a738c50	6a81d742-c374-4613-b022-68c88d8259ea	customerNotifications	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
bfc69467-cdba-437b-927d-4503798c1087	6a81d742-c374-4613-b022-68c88d8259ea	orderSummaryReport	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
05f6f633-09a1-4435-a74d-850519e1f0fb	6a81d742-c374-4613-b022-68c88d8259ea	executiveSaleReport	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
baefa77a-3a46-4613-bb20-da145bc2322f	6a81d742-c374-4613-b022-68c88d8259ea	employeeSummaryReport	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
500de0e6-90bd-4729-996a-b7a10b2ff47a	6a81d742-c374-4613-b022-68c88d8259ea	groupSummaryReport	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
e13d32ef-327e-46ff-8e74-82e0f34bca18	6a81d742-c374-4613-b022-68c88d8259ea	variationSummaryReport	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
072f1c92-cb8d-4f54-b898-98e54d8a52c1	6a81d742-c374-4613-b022-68c88d8259ea	coverSizeSummaryReport	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
d894df1e-b9a5-4131-a334-a59b541a1b0a	6a81d742-c374-4613-b022-68c88d8259ea	tipSummaryReport	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
5fb777ba-ec5b-4264-a637-c4a437344d9e	6a81d742-c374-4613-b022-68c88d8259ea	counterSummaryReport	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
71b48dab-ee33-4eb1-acc4-aad5fcd2599c	6a81d742-c374-4613-b022-68c88d8259ea	deliveryBoys	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
bc90eff4-81db-4450-b6be-625334e1bc5f	6a81d742-c374-4613-b022-68c88d8259ea	liveView	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
c9b7e912-bfdf-478c-8db0-db34c567693e	6a81d742-c374-4613-b022-68c88d8259ea	fullInventory	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
4f21b6db-6bf7-4ee6-9be0-be5d1542a4b0	6a81d742-c374-4613-b022-68c88d8259ea	recipeManagement	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
3de1b496-44e3-4956-9959-665b2c1af1cf	6a81d742-c374-4613-b022-68c88d8259ea	recipeInventory	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
22d28df4-5bd3-4ab9-af77-716242218849	6a81d742-c374-4613-b022-68c88d8259ea	advancedReports	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
18f865df-4d7f-45d1-8d39-eb4dedb1c9dc	6a81d742-c374-4613-b022-68c88d8259ea	expenseTracking	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
f17b13b0-70ca-4299-a11f-fba805afa524	6a81d742-c374-4613-b022-68c88d8259ea	tableManagement	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
95bcc03a-79d4-491c-aed2-bba5dddc73b0	6a81d742-c374-4613-b022-68c88d8259ea	qrMenuOrdering	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
f15bbecd-9c12-499d-aa1b-c570055e8029	6a81d742-c374-4613-b022-68c88d8259ea	staffManagement	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
c2a99c1e-9a77-4fcb-b5b6-a33c6b788608	6a81d742-c374-4613-b022-68c88d8259ea	faceVerification	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
645ba6ab-5309-4c44-8a41-56dc251395b8	6a81d742-c374-4613-b022-68c88d8259ea	geoFencing	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
013cb701-6249-408f-8f25-9612c4a80a14	6a81d742-c374-4613-b022-68c88d8259ea	swiggyZomato	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
3b8d0c86-687d-4262-89eb-827b67a04f45	6a81d742-c374-4613-b022-68c88d8259ea	teamChat	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
0f521ff3-97ab-4ede-aecd-bfbbbdcd7319	6a81d742-c374-4613-b022-68c88d8259ea	thirdPartyIntegration	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
032de964-81f5-4039-8b25-558464a9904c	6a81d742-c374-4613-b022-68c88d8259ea	multiOutlet	f	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
456ac6ec-6dda-4c06-b166-9d349519b8a2	6a81d742-c374-4613-b022-68c88d8259ea	centralDashboard	f	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
a29a7cbf-2c29-464c-99db-4fc019cae8aa	6a81d742-c374-4613-b022-68c88d8259ea	apiIntegrations	f	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
17c325be-599e-4de0-8630-5518e9fec813	6a81d742-c374-4613-b022-68c88d8259ea	alertsNotifications	f	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
f5f5f718-1137-4a6c-8935-4569384470d3	6a81d742-c374-4613-b022-68c88d8259ea	autoStockSystem	f	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
41906a47-4455-4d52-af69-c555edc5ae70	6a81d742-c374-4613-b022-68c88d8259ea	smartInventory	f	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
6c64ed65-b1dc-4783-b938-d7b34ecfa392	6a81d742-c374-4613-b022-68c88d8259ea	deliveryTracking	f	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
8dd987c1-0c1b-47c0-b349-a0304f80b167	6a81d742-c374-4613-b022-68c88d8259ea	crmLoyalty	f	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
f298ec7e-433b-4983-b8af-002613509636	1d4f7e8d-43b4-4f49-a47a-e4f627bc7260	billing	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
981a33b1-4016-4820-8231-404ba37dd7f3	1d4f7e8d-43b4-4f49-a47a-e4f627bc7260	gstInvoice	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
269794d6-b548-462a-b09f-c5c3107be894	1d4f7e8d-43b4-4f49-a47a-e4f627bc7260	multiplePayments	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
fcab11f7-2b5b-4a06-b07f-7cfa87046e54	1d4f7e8d-43b4-4f49-a47a-e4f627bc7260	basicReports	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
ca9b6637-9660-4a52-ae67-91bc46e55730	1d4f7e8d-43b4-4f49-a47a-e4f627bc7260	menuManagement	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
3812d320-b31f-4a64-b9f4-7eb412687b4e	1d4f7e8d-43b4-4f49-a47a-e4f627bc7260	basicInventory	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
bc10caa0-7a20-45d5-9657-6b2b418f4a32	1d4f7e8d-43b4-4f49-a47a-e4f627bc7260	manualInventory	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
7ee110d0-8c57-47a4-af68-b1952c262d2d	1d4f7e8d-43b4-4f49-a47a-e4f627bc7260	customerManagement	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
0b6706c4-8ec8-44f7-a85a-35a8d4f26243	1d4f7e8d-43b4-4f49-a47a-e4f627bc7260	support247	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
b26d1110-5401-4078-8e31-e88cba62218d	1d4f7e8d-43b4-4f49-a47a-e4f627bc7260	barcodeScanner	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
a8b63eff-3552-42f5-94c6-c5046cb166c6	1d4f7e8d-43b4-4f49-a47a-e4f627bc7260	dineIn	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
1db0e9e5-f7c1-46e1-a3e9-8fa647eb65dd	1d4f7e8d-43b4-4f49-a47a-e4f627bc7260	takeaway	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
4b22d32e-6511-429c-b814-ce57b25715cb	1d4f7e8d-43b4-4f49-a47a-e4f627bc7260	delivery	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
e49613d7-4898-4707-94f8-1a45555ec587	1d4f7e8d-43b4-4f49-a47a-e4f627bc7260	cashFlow	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
65e14674-cab9-4338-a45b-4d045dbc5309	1d4f7e8d-43b4-4f49-a47a-e4f627bc7260	withdrawal	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
affdb7b7-1b4f-4812-af0d-ad3ef23c8c74	1d4f7e8d-43b4-4f49-a47a-e4f627bc7260	cashTopUp	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
9a3bc19d-b2fd-40f9-b5cc-2435633c2325	1d4f7e8d-43b4-4f49-a47a-e4f627bc7260	paymentSettings	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
f90decbc-6e62-47cb-b4f2-85f9618d663c	1d4f7e8d-43b4-4f49-a47a-e4f627bc7260	paymentAnalytics	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
12dba5ce-5f15-4d2a-9169-6973456f60c8	1d4f7e8d-43b4-4f49-a47a-e4f627bc7260	paymentReconciliation	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
e1634717-a7cd-48e3-a51b-12a1db506fd7	1d4f7e8d-43b4-4f49-a47a-e4f627bc7260	dailyReconciliation	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
b66e0a7b-0cec-4303-8486-f335b745e10c	1d4f7e8d-43b4-4f49-a47a-e4f627bc7260	paymentSettlements	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
2eecb944-a7b0-4d23-bb5b-fc94e33636da	1d4f7e8d-43b4-4f49-a47a-e4f627bc7260	paymentDisputes	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
9b90f5f1-0c06-466c-afa2-1208c0b338c2	1d4f7e8d-43b4-4f49-a47a-e4f627bc7260	refundManagement	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
61e7fb95-6756-4596-b5ff-73e03b278d4b	1d4f7e8d-43b4-4f49-a47a-e4f627bc7260	paymentAlerts	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
2f8c380c-a035-48eb-a008-7a5735e2652a	1d4f7e8d-43b4-4f49-a47a-e4f627bc7260	paymentHistory	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
2199ddce-0907-447b-95c2-53d153df38c7	1d4f7e8d-43b4-4f49-a47a-e4f627bc7260	customerNotifications	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
925365af-9d4a-41d0-bd21-b07ab0197647	1d4f7e8d-43b4-4f49-a47a-e4f627bc7260	orderSummaryReport	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
11f06774-fad0-4f61-99b9-6402bf83165c	1d4f7e8d-43b4-4f49-a47a-e4f627bc7260	executiveSaleReport	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
966df69b-7174-430e-9e6d-2a9fedb4ab5e	1d4f7e8d-43b4-4f49-a47a-e4f627bc7260	employeeSummaryReport	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
f5809cc2-9d72-4d93-8104-6c7ca64befb8	1d4f7e8d-43b4-4f49-a47a-e4f627bc7260	groupSummaryReport	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
33209dd5-16fe-4c25-a7c1-ddd2883bbd30	1d4f7e8d-43b4-4f49-a47a-e4f627bc7260	variationSummaryReport	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
f6b36715-8068-4f5f-b09f-df1d76f8bea8	1d4f7e8d-43b4-4f49-a47a-e4f627bc7260	coverSizeSummaryReport	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
5dd3dcfa-b304-4484-9671-278845b46ff9	1d4f7e8d-43b4-4f49-a47a-e4f627bc7260	tipSummaryReport	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
c0a7faae-c0cf-4313-a0ab-726af028ec1b	1d4f7e8d-43b4-4f49-a47a-e4f627bc7260	counterSummaryReport	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
26de829b-8af4-44ee-9bb4-9aefaf8079cb	1d4f7e8d-43b4-4f49-a47a-e4f627bc7260	deliveryBoys	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
fbd99cea-14bd-4c2f-80fb-329712536938	1d4f7e8d-43b4-4f49-a47a-e4f627bc7260	liveView	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
c576c3fe-3f79-4782-af70-b6b8e2b3691c	1d4f7e8d-43b4-4f49-a47a-e4f627bc7260	fullInventory	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
99d41e5f-a9c5-4d27-b72e-bfa135fc814a	1d4f7e8d-43b4-4f49-a47a-e4f627bc7260	recipeManagement	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
5a5d292d-fb17-4132-a200-0bd8033b3cfa	1d4f7e8d-43b4-4f49-a47a-e4f627bc7260	recipeInventory	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
5944ac16-8cde-4fc4-bab7-2152fb67ab6e	1d4f7e8d-43b4-4f49-a47a-e4f627bc7260	advancedReports	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
21189757-627b-4537-9d17-63c5bcb895e2	1d4f7e8d-43b4-4f49-a47a-e4f627bc7260	expenseTracking	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
a16452ae-ea06-444a-ba81-adcf6ba16c2a	1d4f7e8d-43b4-4f49-a47a-e4f627bc7260	tableManagement	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
30e76475-db65-4024-b4f5-3e61a02c93f2	1d4f7e8d-43b4-4f49-a47a-e4f627bc7260	qrMenuOrdering	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
90e105b4-e5cc-447f-bfa5-af87cc83a29e	1d4f7e8d-43b4-4f49-a47a-e4f627bc7260	staffManagement	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
89512111-4c74-4d13-b045-03297e255727	1d4f7e8d-43b4-4f49-a47a-e4f627bc7260	faceVerification	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
1fb661e6-b698-40e1-8f83-2301544f0290	1d4f7e8d-43b4-4f49-a47a-e4f627bc7260	geoFencing	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
68736a8c-4170-4e79-88ec-15aeafa6e908	1d4f7e8d-43b4-4f49-a47a-e4f627bc7260	swiggyZomato	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
459774b1-4656-454d-b0a3-af4243e2972c	1d4f7e8d-43b4-4f49-a47a-e4f627bc7260	teamChat	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
bebc932b-a0c2-487c-995d-324f1acd7a7e	1d4f7e8d-43b4-4f49-a47a-e4f627bc7260	thirdPartyIntegration	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
b64639ab-4130-4e1f-ad12-3c6cd33b262d	1d4f7e8d-43b4-4f49-a47a-e4f627bc7260	multiOutlet	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
99321564-2d69-4f49-ba18-5ef436cefd6f	1d4f7e8d-43b4-4f49-a47a-e4f627bc7260	centralDashboard	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
c948f774-ad69-428d-bbe2-2c12ee2b4ad1	1d4f7e8d-43b4-4f49-a47a-e4f627bc7260	apiIntegrations	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
5c200e4e-3703-49e5-bb2c-1b9fef8b4a2e	1d4f7e8d-43b4-4f49-a47a-e4f627bc7260	alertsNotifications	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
8d3b7f41-1303-422f-aa0c-9c903454597d	1d4f7e8d-43b4-4f49-a47a-e4f627bc7260	autoStockSystem	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
7b2ec013-ad91-4d57-b325-917adbbc1760	1d4f7e8d-43b4-4f49-a47a-e4f627bc7260	smartInventory	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
02183a1f-b1ac-4d97-ba4c-c83c9fe3729e	1d4f7e8d-43b4-4f49-a47a-e4f627bc7260	deliveryTracking	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
a1df9872-375a-4c8c-9f80-215134164542	1d4f7e8d-43b4-4f49-a47a-e4f627bc7260	crmLoyalty	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
0536f21f-d15b-44e4-8ebf-9382bfa77a4a	b96a0a14-fc58-4541-b470-1c964ef727b4	billing	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
8368ef93-1c5e-419e-8306-cae4ee10e17b	b96a0a14-fc58-4541-b470-1c964ef727b4	gstInvoice	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
671b1e3d-9e3e-4f9e-ae4f-c5ac72180ff5	b96a0a14-fc58-4541-b470-1c964ef727b4	multiplePayments	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
cb44c521-591d-4e57-97dc-d2cc18e38ceb	b96a0a14-fc58-4541-b470-1c964ef727b4	basicReports	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
e25118aa-f9b9-441d-a21f-07bef1d556a0	b96a0a14-fc58-4541-b470-1c964ef727b4	menuManagement	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
3f29a48f-4811-4e5b-97c2-7146913fa060	b96a0a14-fc58-4541-b470-1c964ef727b4	basicInventory	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
e6fbfaa7-3e74-4fd6-9f3f-3c48196bda67	b96a0a14-fc58-4541-b470-1c964ef727b4	manualInventory	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
c2188f68-e2e6-43f8-899a-73bb3239ccc2	b96a0a14-fc58-4541-b470-1c964ef727b4	customerManagement	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
b179c6fc-b3a2-4862-98a9-33bd7fc5faa5	b96a0a14-fc58-4541-b470-1c964ef727b4	support247	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
9da9c575-e71d-4c25-b1fa-403acef642c6	b96a0a14-fc58-4541-b470-1c964ef727b4	barcodeScanner	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
75912d30-c96d-4ea1-b8c7-e596a5770221	b96a0a14-fc58-4541-b470-1c964ef727b4	dineIn	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
e9a509f0-ef2d-4c9b-ae93-55707301888b	b96a0a14-fc58-4541-b470-1c964ef727b4	takeaway	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
a7f7c7d5-dda1-4853-abb7-c081e437b670	b96a0a14-fc58-4541-b470-1c964ef727b4	delivery	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
60d87b5c-0629-455b-bc1e-6fe0ee27c1e3	b96a0a14-fc58-4541-b470-1c964ef727b4	cashFlow	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
b70449e1-77c9-46fb-bb65-8fc922405fdf	b96a0a14-fc58-4541-b470-1c964ef727b4	withdrawal	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
c3b39fdd-5b10-4aea-b346-4b0d7ea5489a	b96a0a14-fc58-4541-b470-1c964ef727b4	cashTopUp	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
0966feba-b9ef-45eb-816a-b3b3e61e0323	b96a0a14-fc58-4541-b470-1c964ef727b4	paymentSettings	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
8e74115d-373c-4cb7-a65b-cfcd56498ebe	b96a0a14-fc58-4541-b470-1c964ef727b4	paymentAnalytics	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
922aac18-2463-4bf3-984f-e16a7916cea6	b96a0a14-fc58-4541-b470-1c964ef727b4	paymentReconciliation	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
5866a8d4-75eb-4181-b2d5-8dd93df7677e	b96a0a14-fc58-4541-b470-1c964ef727b4	dailyReconciliation	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
65d086cd-188c-40c5-8929-4be65781eb56	b96a0a14-fc58-4541-b470-1c964ef727b4	paymentSettlements	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
a5a8391b-9055-4cac-bb14-3f970181cc4f	b96a0a14-fc58-4541-b470-1c964ef727b4	paymentDisputes	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
d9d0358c-330b-4ec2-9f18-8dd7e65382c7	b96a0a14-fc58-4541-b470-1c964ef727b4	refundManagement	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
a3d11bc6-c842-4149-92b6-16c08b34a7ec	b96a0a14-fc58-4541-b470-1c964ef727b4	paymentAlerts	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
0cd56813-23aa-4600-9695-08c8b24b457e	b96a0a14-fc58-4541-b470-1c964ef727b4	paymentHistory	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
b20ee051-7ac8-4d42-adbb-d1c12a91c6f7	b96a0a14-fc58-4541-b470-1c964ef727b4	customerNotifications	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
6a10cc0f-5738-4acb-8098-5e07c3f3281e	b96a0a14-fc58-4541-b470-1c964ef727b4	orderSummaryReport	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
f469e775-d6ff-4c30-ab2a-b056cef0e514	b96a0a14-fc58-4541-b470-1c964ef727b4	executiveSaleReport	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
78f6db47-1bc4-495c-8130-5c80feed99e4	b96a0a14-fc58-4541-b470-1c964ef727b4	employeeSummaryReport	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
c866bc0d-b028-4cec-8b1a-42f58c35bc22	b96a0a14-fc58-4541-b470-1c964ef727b4	groupSummaryReport	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
85481243-6600-4706-a67b-9b9d3c40586b	b96a0a14-fc58-4541-b470-1c964ef727b4	variationSummaryReport	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
54855669-335e-4ea8-a487-cbc565a1f699	b96a0a14-fc58-4541-b470-1c964ef727b4	coverSizeSummaryReport	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
b8f69716-9702-43e2-bc70-9b3c3c9e38a6	b96a0a14-fc58-4541-b470-1c964ef727b4	tipSummaryReport	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
1e9a42eb-3a7c-4ef8-b3a0-8a21bc56a32c	b96a0a14-fc58-4541-b470-1c964ef727b4	counterSummaryReport	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
425b78f3-2377-4047-8e16-81fa287632a7	b96a0a14-fc58-4541-b470-1c964ef727b4	deliveryBoys	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
37c75346-1351-467e-b334-b123094bf1b8	b96a0a14-fc58-4541-b470-1c964ef727b4	liveView	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
b18f6595-8266-4735-85a6-b6e8a07ccf93	b96a0a14-fc58-4541-b470-1c964ef727b4	fullInventory	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
4df971b8-f366-4920-aa98-f6207c559f60	b96a0a14-fc58-4541-b470-1c964ef727b4	recipeManagement	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
b18806d5-dea6-4c87-b027-f8c5405ea45b	b96a0a14-fc58-4541-b470-1c964ef727b4	recipeInventory	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
4f60b555-d6e9-46ea-935f-ab68812d9f82	b96a0a14-fc58-4541-b470-1c964ef727b4	advancedReports	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
48915e54-be9d-4ca5-9b88-c0e1974ed954	b96a0a14-fc58-4541-b470-1c964ef727b4	expenseTracking	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
cd13a6e4-e2a6-40e8-9a82-4f75cb74dc74	b96a0a14-fc58-4541-b470-1c964ef727b4	tableManagement	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
c7c6f14a-f488-47fd-be27-5b9d068a67a4	b96a0a14-fc58-4541-b470-1c964ef727b4	qrMenuOrdering	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
6bc894e3-907c-408f-bc43-829a80896af3	b96a0a14-fc58-4541-b470-1c964ef727b4	staffManagement	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
bddde81b-16b9-4760-a90a-35100ea054bf	b96a0a14-fc58-4541-b470-1c964ef727b4	faceVerification	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
31c906b3-f362-422b-9b2e-d4ccf8b533a9	b96a0a14-fc58-4541-b470-1c964ef727b4	geoFencing	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
e99035c2-38a8-4b89-b37c-aa31eedbc0f9	b96a0a14-fc58-4541-b470-1c964ef727b4	swiggyZomato	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
d9a3acf0-3b0d-4a2a-8294-ab18c3d3ab5a	b96a0a14-fc58-4541-b470-1c964ef727b4	teamChat	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
a97104e8-f9fb-44d1-8e08-8fc6360864ff	b96a0a14-fc58-4541-b470-1c964ef727b4	thirdPartyIntegration	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
ebe45408-6328-417a-ab5c-b53878961b0f	b96a0a14-fc58-4541-b470-1c964ef727b4	multiOutlet	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
81bda624-8d2e-4679-a8b1-3f83e673eb25	b96a0a14-fc58-4541-b470-1c964ef727b4	centralDashboard	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
9253b85d-3d59-4e60-8572-7c9c8c7bfeca	b96a0a14-fc58-4541-b470-1c964ef727b4	apiIntegrations	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
d50250fe-8d7d-4f22-a7e8-56fce91504e3	b96a0a14-fc58-4541-b470-1c964ef727b4	alertsNotifications	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
a565c064-0486-48e5-8530-fd67b8898117	b96a0a14-fc58-4541-b470-1c964ef727b4	autoStockSystem	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
915fcb24-7fbb-4978-a932-5d8c9ce5e138	b96a0a14-fc58-4541-b470-1c964ef727b4	smartInventory	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
a2c7450d-204d-49ea-b039-1ed39d66359a	b96a0a14-fc58-4541-b470-1c964ef727b4	deliveryTracking	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
6795366e-dcd0-48a6-bba5-f976cfaa9c8a	b96a0a14-fc58-4541-b470-1c964ef727b4	crmLoyalty	t	2026-04-08 21:56:40.483166+00	2026-04-08 21:56:40.483166+00
f3c049f6-14fd-475a-a9dc-240a85530f87	f0b45032-eb52-4d0f-87d9-acd81d4d0a9e	cashFlow	f	2026-04-08 21:56:40.483166+00	2026-04-09 03:21:09.746097+00
c517a693-cab7-49a9-9c21-e0b57ac29fcf	f0b45032-eb52-4d0f-87d9-acd81d4d0a9e	withdrawal	f	2026-04-08 21:56:40.483166+00	2026-04-09 03:21:09.746097+00
9ebd3b3b-84fe-4218-8a7b-70f8ee359abd	f0b45032-eb52-4d0f-87d9-acd81d4d0a9e	cashTopUp	f	2026-04-08 21:56:40.483166+00	2026-04-09 03:21:09.746097+00
dd4d6361-4f7b-4b58-be82-28e274991e85	f0b45032-eb52-4d0f-87d9-acd81d4d0a9e	employeeSummaryReport	f	2026-04-08 21:56:40.483166+00	2026-04-09 03:21:09.746097+00
98dd1338-0279-48c4-bd62-06c93f94b736	f0b45032-eb52-4d0f-87d9-acd81d4d0a9e	groupSummaryReport	f	2026-04-08 21:56:40.483166+00	2026-04-09 03:21:09.746097+00
36492f58-7af7-4784-a681-d07e57d97cb7	f0b45032-eb52-4d0f-87d9-acd81d4d0a9e	variationSummaryReport	f	2026-04-08 21:56:40.483166+00	2026-04-09 03:21:09.746097+00
5f337b06-43db-4b21-94c9-44d5802ff8a7	f0b45032-eb52-4d0f-87d9-acd81d4d0a9e	coverSizeSummaryReport	f	2026-04-08 21:56:40.483166+00	2026-04-09 03:21:09.746097+00
7970b275-f8b9-4fa1-bb04-be446e6c70e3	f0b45032-eb52-4d0f-87d9-acd81d4d0a9e	tipSummaryReport	f	2026-04-08 21:56:40.483166+00	2026-04-09 03:21:09.746097+00
97263e6e-645e-4bb2-a4c8-1efb4372a32f	f0b45032-eb52-4d0f-87d9-acd81d4d0a9e	counterSummaryReport	f	2026-04-08 21:56:40.483166+00	2026-04-09 03:21:09.746097+00
3e8c07e3-20c2-4d64-a767-3037f79cc57a	32e2d242-c7fc-4f46-892a-4572f2306bd7	advancedAnalytics	f	2026-04-09 03:21:09.746097+00	2026-04-09 03:21:09.746097+00
ea0e8506-2313-4daf-ae8b-4cfae3de0c5e	f0b45032-eb52-4d0f-87d9-acd81d4d0a9e	advancedAnalytics	f	2026-04-09 03:21:09.746097+00	2026-04-09 03:21:09.746097+00
08dac2a6-2acb-4bd5-a645-40ccf13269d4	1d4f7e8d-43b4-4f49-a47a-e4f627bc7260	advancedAnalytics	t	2026-04-09 03:21:09.746097+00	2026-04-09 03:21:09.746097+00
54e06b51-f222-45b4-bc60-565b0d3e5c9a	1209000d-9d27-4467-95da-c4a2d623902f	advancedAnalytics	f	2026-04-09 03:21:09.746097+00	2026-04-09 03:21:09.746097+00
a1fbb602-9ac2-44bd-8902-c181011c77cd	6a81d742-c374-4613-b022-68c88d8259ea	advancedAnalytics	f	2026-04-09 03:21:09.746097+00	2026-04-09 03:21:09.746097+00
f0d8a24e-6d06-415a-a5bb-a365b58fd771	b96a0a14-fc58-4541-b470-1c964ef727b4	advancedAnalytics	t	2026-04-09 03:21:09.746097+00	2026-04-09 03:21:09.746097+00
7aa8cb18-d6a1-4cce-9bb3-7de6abe1a284	32e2d242-c7fc-4f46-892a-4572f2306bd7	creditLedger	f	2026-04-09 03:21:09.746097+00	2026-04-09 03:21:09.746097+00
b5fce3b4-e8ba-4821-aec8-91b0fcb99e43	f0b45032-eb52-4d0f-87d9-acd81d4d0a9e	creditLedger	t	2026-04-09 03:21:09.746097+00	2026-04-09 03:21:09.746097+00
a9772ca4-a833-4b4f-b650-645f36dddf8d	1d4f7e8d-43b4-4f49-a47a-e4f627bc7260	creditLedger	t	2026-04-09 03:21:09.746097+00	2026-04-09 03:21:09.746097+00
1b10a3ca-57fd-4010-8fd1-c2e607f29387	1209000d-9d27-4467-95da-c4a2d623902f	creditLedger	t	2026-04-09 03:21:09.746097+00	2026-04-09 03:21:09.746097+00
4b0539fa-afda-4851-8b62-87efc187885f	6a81d742-c374-4613-b022-68c88d8259ea	creditLedger	t	2026-04-09 03:21:09.746097+00	2026-04-09 03:21:09.746097+00
af361ef8-56e5-480e-bde6-8568d223d0a6	b96a0a14-fc58-4541-b470-1c964ef727b4	creditLedger	t	2026-04-09 03:21:09.746097+00	2026-04-09 03:21:09.746097+00
489d4f65-dc5b-4f8d-99eb-79269627a340	32e2d242-c7fc-4f46-892a-4572f2306bd7	aiInsights	f	2026-04-09 03:21:09.746097+00	2026-04-09 03:21:09.746097+00
5737d9b4-7c73-48dd-b8d0-11529c689dea	f0b45032-eb52-4d0f-87d9-acd81d4d0a9e	aiInsights	f	2026-04-09 03:21:09.746097+00	2026-04-09 03:21:09.746097+00
29a019c3-daa5-4e67-8f63-7cb8f9bddac8	1d4f7e8d-43b4-4f49-a47a-e4f627bc7260	aiInsights	t	2026-04-09 03:21:09.746097+00	2026-04-09 03:21:09.746097+00
b233c5a6-7689-4aa0-9507-4b81986eb2f5	1209000d-9d27-4467-95da-c4a2d623902f	aiInsights	f	2026-04-09 03:21:09.746097+00	2026-04-09 03:21:09.746097+00
f7886cce-b663-47ad-9525-9c445b564b3d	6a81d742-c374-4613-b022-68c88d8259ea	aiInsights	f	2026-04-09 03:21:09.746097+00	2026-04-09 03:21:09.746097+00
8eb28ccd-a27e-49d9-b308-5c9162494f6f	b96a0a14-fc58-4541-b470-1c964ef727b4	aiInsights	t	2026-04-09 03:21:09.746097+00	2026-04-09 03:21:09.746097+00
\.


--
-- Data for Name: user_roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_roles (id, user_id, role, customer_id, store_id, pin, is_active, created_at, staff_code, face_photo_url, work_start_time, work_end_time, fingerprint_enabled, salary, ref_code) FROM stdin;
59e4f23d-f4aa-462c-a514-104cd804c6c9	cd638a8c-1d78-4d73-a417-9f2c4d57899a	admin	\N	\N	\N	t	2026-01-13 23:01:22.216702+00	07414646	\N	09:00:00	18:00:00	f	0	ADM57014
e6225801-5cb7-445b-a635-8fb4395760bb	e21f6868-86ce-4e16-a383-abdbf609967a	owner	1f309c22-eb0a-4786-984a-091857f72689	\N	\N	t	2026-05-03 17:25:13.826816+00	69850827	\N	09:00:00	18:00:00	f	0	OWN56659
1b9c719a-0868-4b4d-b714-9440f09ab24e	da6b914e-8fff-4216-8ba9-0d7a35778c89	store_manager	1f309c22-eb0a-4786-984a-091857f72689	b2e79446-68ff-4f86-89e4-9e0def4e5072	\N	t	2026-05-03 17:36:46.040879+00	65898678	\N	09:00:00	18:00:00	f	0	MGR25487
c3f668dd-f00d-4850-9247-7f953384fd46	fb98c9f0-ac48-42dd-a65b-a86274ef756b	staff	1f309c22-eb0a-4786-984a-091857f72689	b2e79446-68ff-4f86-89e4-9e0def4e5072	$2a$10$0fDHqhD2ExdJTJdCiCovcOM/mEEGw4d9Z18dLNopjGv0pndoGH/Ua	t	2026-05-08 02:05:00.442022+00	10895610	https://kqoveyroyhfbcdedyzop.supabase.co/storage/v1/object/public/staff-faces/temp_1778205898359_1778205898359.jpg	09:00:00	18:00:00	t	250000	STF00989
\.


--
-- PostgreSQL database dump complete
--

