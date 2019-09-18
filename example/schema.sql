CREATE TABLE public.person
(
  id serial NOT NULL,
  first_name varchar(50) NOT NULL,
  last_name varchar(50) NOT NULL,
  email varchar(50) NOT NULL,
  CONSTRAINT person_pkey PRIMARY KEY (id)
);
