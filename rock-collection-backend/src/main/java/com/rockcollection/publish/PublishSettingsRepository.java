// PublishSettingsRepository.java - Spring Data repository for the publish settings row
package com.rockcollection.publish;

import org.springframework.data.jpa.repository.JpaRepository;

public interface PublishSettingsRepository extends JpaRepository<PublishSettings, Integer> {
}
