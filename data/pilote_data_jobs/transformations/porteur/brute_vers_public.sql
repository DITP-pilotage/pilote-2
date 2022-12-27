TRUNCATE TABLE public.porteur;

INSERT INTO public.porteur
    SELECT porteur_id as id,
           porteur_name as nom
    FROM raw_data.metadata_porteur m_porteur;
