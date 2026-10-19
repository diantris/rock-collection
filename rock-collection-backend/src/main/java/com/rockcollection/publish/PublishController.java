// PublishController.java - REST endpoints for the publish settings and the Publish button
package com.rockcollection.publish;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/publish")
public class PublishController {

    private final PublishService publishService;

    public PublishController(PublishService publishService) {
        this.publishService = publishService;
    }

    @GetMapping("/settings")
    public PublishDto.Settings settings() {
        return publishService.settings();
    }

    @PutMapping("/settings")
    public PublishDto.Settings updateSettings(@Valid @RequestBody PublishDto.SettingsRequest request) {
        return publishService.updateSettings(request);
    }

    /** Marks every specimen to show on the public site. */
    @PostMapping("/all-specimens")
    public PublishDto.Settings publishAllSpecimens() {
        return publishService.publishAllSpecimens();
    }

    /** Regenerates the public site and commits it to the Pages repo. */
    @PostMapping
    public PublishDto.Result publish() {
        return publishService.publish();
    }
}
