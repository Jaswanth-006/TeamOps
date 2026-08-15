output "site_url" {
  description = "The site's HTTPS URL"
  value       = "https://${local.fqdn}"
}
