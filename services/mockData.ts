import { AppState, User, Subject } from '../types';

const INITIAL_SUBJECTS: Subject[] = [
  { name: 'Account', type: 'Theory' },
  { name: 'English', type: 'Theory' },
  { name: 'Nepali', type: 'Theory' },
  { name: 'Social Studies', type: 'Theory' },
  { name: 'Travel Tourism and Mountaineering', type: 'Theory' },
  { name: 'Hotel Management', type: 'Theory' },
  { name: 'Front Office', type: 'Theory' },
  { name: 'Food and Beverage Service', type: 'Practical' },
  { name: 'House Keeping', type: 'Practical' },
  { name: 'Food Production', type: 'Practical' },
  { name: 'English for Hospitality', type: 'Theory' },
  { name: 'Personal Development', type: 'Theory' },
  { name: 'Entrepreneurship', type: 'Theory' },
  { name: 'Event Management', type: 'Theory' },
  { name: 'Hospitality Management', type: 'Theory' },
  { name: 'Food Science and Nutrition', type: 'Theory' },
  { name: 'French for Hospitality', type: 'Theory' },
  { name: 'Chemistry', type: 'Theory' },
  { name: 'Business Communication', type: 'Theory' }
];

const RAW_STUDENT_DATA = `
1	aachal shah		aachalshah	aac409
2	Aadarsh E. Chy		aadarshechy	eaa218
3	Aadarsh M. Chy		aadarshmchy	maa653
4	Aadarsh J. Chy>h	JUMERAH	aadarshjchy	haa984
5	Aadesh kr. Chy		aadeshkrchy	aad244
6	Aamod Pandit		aamodpandit	aam316
7	Aaroh Khadka		aarohkhadka	aar209
8	Aaroh khadka>H	SHERATON	aarohkhadka	haa832
9	Aaroshi subedi		aaroshisube	aar110
10	Aaroshi subedi>H	SHERATON	aaroshisube	haa118
11	Aashika Poudel 		aashikapoud	aas815
12	Aashika Poudel>H	SHERATON	aashikapoud	haa625
13	Aashish E. Gurung		aashishegur	eaa326
14	Aashish Haluwai		aashishhalu	aas363
15	Aashish S. Gurung		aashishsgur	gaa856
16	Aashish S. Gurung>H	SHERATON	aashishsgur	haa610
17	Aayush Baral		aayushbaral	aay126
18	Aayush Baral>H	SHERATON	aayushbaral	haa934
19	Aayush Budhathoki		aayushbudha	aay173
20	Aayush Rajbanshi		aayushrajba	aay371
21	Aayush Rajbanshi>H	JUMERAH	aayushrajba	haa269
22	Aayusha Rai		aayusharai	aay550
23	Aayusha W. Rai>H	SHERATON	aayushawrai	haa832
24	Alsan Khatri		alsankhatri	als290
25	Aman Kr. Yadav		amankryadav	ama970
26	Amit Kr. Sutihar		amitkrsutih	ami401
27	Amit Kr. Yadav		amitkryadav	ami718
28	Angel Shah 		angelshah	ang423
29	Angel Shah H1	JUMERAH	angelshahh1	han878
30	Anish Mehta		anishmehta	ani942
31	Anjal Khadka		anjalkhadka	anj671
32	Anjal Khadka H1	SHERATON	anjalkhadka	han720
33	Anjila Ghimire H1	SHERATON	anjilaghimi	anj890
34	Ankit Gupta 		ankitgupta	ank205
35	Ankit Gupta H1	SHERATON	ankitguptah	han756
36	Ankit Mallik		ankitmallik	ank252
37	Ankit Mallik H1		ankitmallik	ank239
38	Arjun Kr. Mandal		arjunkrmand	arj359
39	Ashik Luitel Khatri		ashikluitel	ash539
40	Asmita Roy		asmitaroy	asm903
41	Bibek Yadav		bibekyadav	bib498
42	Bijay Bdr. Bista		bijaybdrbis	bij915
43	Bipin Rajbanshi		bipinrajban	bip946
44	Bipin Rajbanshi>H	SHERATON	bipinrajban	hbi995
45	Bishal Kumar		bishalkumar	bis717
46	Bishal Kumar H1	SHERATON	bishalkumar	hbi383
47	Bishal Mandal		bishalmanda	bis628
48	Bishal Rajbanshi		bishalrajba	bis416
49	Chandan Kr. Roy		chandankrro	cha204
50	Chudamani  Rajbansi		chudamanira	chu191
51	Debika Katwal		debikakatwa	deb994
52	Debika Katwal H1	SHERATON	debikakatwa	hde928
53	Dhiraj Kr. Rajak		dhirajkrraj	dhi501
54	dhirajan Kr. Yadav 		dhirajankry	dhi120
55	Dilip Meheta		dilipmeheta	dil271
56	Dipal Gurung		dipalgurung	dip114
57	Dipesh Luitel Kc 		dipeshluite	dip173
58	Dipesh Luitel Kc>H	SHERATON	dipeshluite	hdi851
59	Diwas Karki		diwaskarki	diw426
60	Diwas Karki>H	SHERATON	diwaskarki>	hdi485
61	Jamshed Miya		jamshedmiya	jam456
62	Jenisha Shrestha		jenishashre	jen527
63	Kabatulla Miya		kabatullami	kab411
64	Kalim Khan		kalimkhan	kal694
65	Karun Dhungana 		karundhunga	kar865
66	Karun Dhungana>H	SHERATON	karundhunga	hka700
67	Kausal poudel		kausalpoude	kau274
68	Khemraj Hamal		khemrajhama	khe377
69	Khemraj Hamal>H	SHERATON	khemrajhama	hkh221
70	Kostika Bhujel		kostikabhuj	kos308
71	Krish Kha Tharu		krishkhatha	ish281
72	Krishna Kr Bhandari		krishnakrbh	ish118
73	Krishna Sahu		krishnasahu	ish625
74	Lakshya Shah		lakshyashah	lak667
75	Laxmi Uraw		laxmiuraw	lax280
76	Lucky Gacchadhar		luckygaccha	luc475
77	Manish Kr. Majhi		manishkrmaj	man811
78	MD Saddam Rain		mdsaddamrai	mds173
79	Mukesh Khadka 		mukeshkhadk	muk356
80	Mukesh Khadka>H	SHERATON	mukeshkhadk	hmu195
81	Mukesh Yadav 		mukeshyadav	muk338
82	Nabin Kr Yadav		nabinkryada	nab620
83	Nanda Lal Yadav		nandalalyad	nan787
84	Naresh Rajbanshi>H	SHERATON	nareshrajba	hna987
85	Nasiv Chy		nasivchy	nas371
86	Neha Kri. Mandal		nehakrimand	neh539
87	Nikesh Shrestha		nikeshshres	nik947
88	Nikhil Kr. Sharma		nikhilkrsha	nik188
89	Nikhil Sharma>H	SHERATON	nikhilsharm	hni297
90	Niraj Kr. Yadav		nirajkryada	nir274
91	Niranjan Rajbhar		niranjanraj	nir191
92	Nirmal Khatri		nirmalkhatr	nir310
93	Nirmal Khatri>H	SHERATON	nirmalkhatr	hni585
94	Nitesh Kr Mehta		niteshkrmeh	nit797
95	Nitesh Kr. Chel		niteshkrche	nit616
96	Pankaj Kr Chy		pankajkrchy	pan360
97	Parbat Gurung		parbatgurun	par580
98	Payal Mandal		payalmandal	pay675
99	Prabin Gurung		prabingurun	pra129
100	Prajwal Magrati		prajwalmagr	pra810
101	Prem Khadka		premkhadka	pre551
102	Pratikshya Sardar		pratikshyas	pra289
103	Rahul Rajbanshi		rahulrajban	rah358
104	Rishav Shah		rishavshah	ris778
105	Ritesh Kumar Gupta		riteshkumar	rit445
106	Ritik Yadav 		ritikyadav	rit741
107	Rohit Kumar Mehta 		rohitkumarm	roh586
108	Roshna Nepal		roshnanepal	ros537
109	Roshna Nepal>H	SHERATON	roshnanepal	hro900
110	Sabina Urang		sabinaurang	sab859
111	Sadhana Mahat		sadhanamaha	sad585
112	Saimona Upadhaya		saimonaupad	sai527
113	Saimona Upadhya>H	SHERATON	saimonaupad	hsa437
115	Sandhya E. Biswakarma 		sandhyaebis	san480
116	Sandhya S. BK		sandhyasbk	san175
117	Sandhya S. BK>H	SHERATON	sandhyasbk>	hsa187
118	Sandip Adhikari		sandipadhik	san632
119	Sandip Adhikari>H	SHERATON	sandipadhik	hsa982
120	Sandip Gaderi		sandipgader	san132
121	Sanjib Sah		sanjibsah	san262
122	Santosh Kr. Yadav		santoshkrya	san418
123	Satrudhan Pandit		satrudhanpa	sat772
124	Shamser Alam		shamseralam	sha540
125	Shankar Sah		shankarsah	sha885
126	Shiva Ratan Mandal		shivaratanm	shi188
127	Shubham Kha 		shubhamkha	shu752
128	Sikendra Yadav		sikendrayad	sik809
129	Sirjan Khadka 		sirjankhadk	sir120
130	Sital Mahato		sitalmahato	sit868
131	Sonu Chy 		sonuchy	son511
132	Sonu Chy>H	SHERATON	sonuchy>h	hso689
133	Subas Roy		subasroy	sub754
134	Sujal Chy		sujalchy	suj428
135	Sujal Chy>H	SHERATON	sujalchy>h	hsu219
136	Sulav Nepal		sulavnepal	sul543
137	Sumit Kr Malaha		sumitkrmala	sum354
138	Sunil Kr Yadav		sunilkryada	sun603
139	Sunil Kr. Shah		sunilkrshah	sun124
140	Suraj Das		surajdas	sur904
141	Suraj Pd. Sah		surajpdsah	sur406
142	Suryasankar Pandit		suryasankar	sur837
143	Sushanta Nepali		sushantanep	sus703
144	Tanweer Aalam 		tanweeraala	tan283
145	Umakant Chy		umakantchy	uma504
146	Umakanta Chy>H	SHERATON	umakantachy	uma401
147	Yogeshwar Pandit		yogeshwarpa	yog501
149	Yugesh Poudel 		yugeshpoude	yug503
`;

const parseStudents = (data: string): User[] => {
  return data.trim().split('\n').map((line, index) => {
    const parts = line.split('\t');
    const name = parts[1]?.trim() || '';
    const rawSection = parts[2]?.trim().toUpperCase() || '';
    const username = parts[3]?.trim() || `user_${index}`;
    const password = parts[4]?.trim() || 'password';

    let section = 'Marriott';
    let classId = '12';

    if (rawSection === 'JUMERAH') {
      section = 'Jumeirah';
      classId = '11';
    } else if (rawSection === 'SHERATON') {
      section = 'Sheraton';
      classId = '12';
    } else if (rawSection === 'EMIRATES') {
        section = 'Emirates';
        classId = '12';
    }

    return {
      id: `s_${index + 10}`, // offset to avoid collisions with initial users
      name,
      role: 'student',
      allowedRoles: ['student'],
      email: `${username}@galaxy.edu.np`,
      password,
      status: 'active',
      classId,
      section,
      annualFee: 100000,
      discount: 0,
      totalPaid: 0
    } as User;
  });
};

const DYNAMIC_STUDENTS = parseStudents(RAW_STUDENT_DATA);

export const INITIAL_USERS: User[] = [
  { id: 'u1', name: 'Super Admin', role: 'admin', allowedRoles: ['admin', 'teacher', 'accountant'], email: 'admin@galaxy.edu.np', password: 'password', status: 'active' },
  { id: 'u2', name: 'Suresh Pradhan', role: 'admin', allowedRoles: ['admin'], email: 'suresh@galaxy.edu.np', password: 'password', status: 'active' }, 
  { id: 'u3', name: 'Ramesh Adhikari', role: 'accountant', allowedRoles: ['accountant'], email: 'ramesh@galaxy.edu.np', password: 'password', status: 'active' },
  { id: 'u4', name: 'Sarita Sharma', role: 'teacher', allowedRoles: ['teacher'], email: 'sarita@galaxy.edu.np', password: 'password', status: 'active', subjects: ['Hotel Management', 'Food Production'] },
  { id: 'u5', name: 'Bishal Gurung', role: 'teacher', allowedRoles: ['teacher'], email: 'bishal@galaxy.edu.np', password: 'password', status: 'active', subjects: ['Chemistry', 'Food Science and Nutrition'] },
  { id: 'u8', name: 'Gita Singh', role: 'developer', allowedRoles: ['developer', 'admin'], email: 'dheejan@gmail.com', password: 'password', status: 'active' },
  { id: 'u9', name: 'Hari Shrestha', role: 'intern', allowedRoles: ['intern'], email: 'hari@galaxy.edu.np', password: 'password', status: 'active' },
  ...DYNAMIC_STUDENTS
];

export const INITIAL_STATE: AppState = {
  currentUser: null,
  originalUser: null,
  users: INITIAL_USERS,
  assignments: [
    {
      id: 'a1',
      title: 'History of Hospitality in Nepal',
      description: 'Write a 500-word essay on the evolution of 5-star hotels in Kathmandu and Pokhara.',
      subject: 'Hotel Management',
      teacherId: 'u4',
      targetClassId: '12',
      dueDate: '2023-11-15',
      createdAt: '2023-11-01',
    }
  ],
  submissions: [
    {
      id: 's1',
      assignmentId: 'a1',
      studentId: 's_17', // Aayush Baral
      studentName: 'Aayush Baral',
      content: 'The hospitality industry in Nepal began with the opening of Royal Hotel...',
      submittedAt: '2023-11-02',
    }
  ],
  invoices: [
     {
       id: 'inv1',
       studentId: 's_10',
       studentName: 'aachal shah',
       title: 'First Term Fee (30%)',
       amount: 30000,
       dueDate: '2023-10-15',
       issuedAt: '2023-10-01',
       status: 'paid'
     }
  ],
  fees: [
    {
      id: 'f1',
      receiptNumber: 1001,
      invoiceId: 'inv1',
      studentId: 's_10',
      studentName: 'aachal shah',
      amount: 30000,
      description: 'First Term Fee Payment',
      date: '2023-10-05',
      status: 'paid',
      remainingDueSnapshot: 70000
    }
  ],
  examSessions: [
    {
      id: 'es1',
      name: 'First Term 2024',
      type: 'Term Exam',
      status: 'closed',
      startDate: '2023-10-01'
    },
    {
      id: 'es2',
      name: 'Second Term 2024',
      type: 'Term Exam',
      status: 'open',
      startDate: '2024-02-15'
    }
  ],
  examReports: [],
  notices: [
    {
      id: 'n1',
      title: 'Dashain & Tihar Vacation',
      content: 'School will remain closed for the upcoming Dashain and Tihar festivals starting from next week.',
      date: '2023-10-01',
      postedBy: 'Suresh Pradhan',
      audience: 'all',
    }
  ],
  roleRequests: [],
  receiptCounter: 1002,
  availableSubjects: INITIAL_SUBJECTS,
  systemClasses: [
    { name: '11', sections: ['Accor', 'Jumeirah', 'Hyatt', 'Fourseasons'] },
    { name: '12', sections: ['Emirates', 'Marriott', 'Sheraton'] },
    { name: 'HDHM-SEM1', sections: [] },
    { name: 'HDHM-SEM2', sections: [] },
    { name: 'HDHM-SEM3', sections: [] }
  ],
  workLogs: []
};
